/*
 * Serial, coalescing preference writer for per-space workspace navigation.
 * A lane has at most one write in flight. Patches queued behind that write are
 * merged to the newest target, so an old acknowledgement can never clear a
 * newer pending edit or be mistaken for confirmation of the latest target.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.OpenBotPreferenceSaveQueue = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function mergePatch(previous, patch) {
    var next = Object.assign({}, previous || {}, patch || {});
    if (patch && patch.experimentalCollapsedSections) {
      next.experimentalCollapsedSections = Object.assign({}, previous && previous.experimentalCollapsedSections || {},
        patch.experimentalCollapsedSections);
    }
    return next;
  }

  function create(options) {
    options = options || {};
    if (typeof options.write !== 'function') throw new TypeError('Preference save queue requires write()');
    var lanes = new Map();
    var generation = 0;

    function laneFor(spaceId) {
      var key = String(spaceId);
      if (!lanes.has(key)) lanes.set(key, {
        spaceId: key, pending: null, pendingContext: null, running: false, inFlight: false,
        latestGeneration: 0, confirmedGeneration: 0, waiters: []
      });
      return lanes.get(key);
    }

    function settleWaiters(lane, outcome) {
      var remaining = [];
      lane.waiters.forEach(function (waiter) {
        if (waiter.generation <= outcome.generation) waiter.resolve(outcome);
        else remaining.push(waiter);
      });
      lane.waiters = remaining;
    }

    async function drain(lane) {
      if (lane.running) return;
      lane.running = true;
      try {
        while (lane.pending) {
          var patch = lane.pending;
          var context = lane.pendingContext || {};
          var writeGeneration = lane.latestGeneration;
          lane.pending = null;
          lane.pendingContext = null;
          lane.inFlight = true;
          var outcome;
          try {
            var value = await options.write(lane.spaceId, patch, Object.assign({}, context, {
              generation: writeGeneration
            }));
            outcome = { ok: true, value: value, error: null, spaceId: lane.spaceId,
              scopeRevision: context.scopeRevision, generation: writeGeneration };
          } catch (error) {
            outcome = { ok: false, value: null, error: error, spaceId: lane.spaceId,
              scopeRevision: context.scopeRevision, generation: writeGeneration };
          } finally {
            lane.inFlight = false;
          }
          outcome.latest = !lane.pending && lane.latestGeneration === writeGeneration;
          if (outcome.latest && outcome.ok) lane.confirmedGeneration = writeGeneration;
          settleWaiters(lane, outcome);
          if (typeof options.onSettled === 'function') {
            try { options.onSettled(outcome); } catch (error) {}
          }
        }
      } finally {
        lane.running = false;
      }
    }

    function enqueue(spaceId, patch, context) {
      var lane = laneFor(spaceId);
      lane.pending = mergePatch(lane.pending, patch);
      lane.pendingContext = Object.assign({}, lane.pendingContext || {}, context || {});
      lane.latestGeneration = ++generation;
      var target = {
        spaceId: lane.spaceId,
        generation: lane.latestGeneration,
        promise: null
      };
      target.promise = new Promise(function (resolve) {
        lane.waiters.push({ generation: target.generation, resolve: resolve });
      });
      if (!lane.running) drain(lane);
      return target;
    }

    function state(spaceId) {
      var lane = lanes.get(String(spaceId));
      if (!lane) return { spaceId: String(spaceId), pending: false, inFlight: false,
        latestGeneration: 0, confirmedGeneration: 0, lastIsLatest: true };
      return {
        spaceId: lane.spaceId,
        pending: !!lane.pending,
        inFlight: lane.inFlight,
        latestGeneration: lane.latestGeneration,
        confirmedGeneration: lane.confirmedGeneration,
        lastIsLatest: lane.confirmedGeneration === lane.latestGeneration
      };
    }

    return { enqueue: enqueue, state: state };
  }

  return { create: create, mergePatch: mergePatch };
});
