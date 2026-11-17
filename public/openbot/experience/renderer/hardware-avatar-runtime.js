(function (root) {
  'use strict';

  var profiles = {
    screen: { width: 320, height: 240 },
    'avatar-only': { width: 160, height: 160 }
  };
  var poses = ['idle', 'queued', 'thinking', 'working', 'waiting', 'done', 'error', 'interrupted', 'pet', 'wave', 'cheer', 'rest'];
  var plushCharacter = 'pal-capsule';
  var plushPoses = {
    idle: { asset: 'idle.png', frame: 208 },
    queued: { asset: 'queued.png', frame: 208 },
    waiting: { asset: 'waiting.png', frame: 192 },
    thinking: { asset: 'thinking.png', frame: 184 },
    working: { asset: 'working.png', frame: 187 },
    done: { asset: 'done.png', frame: 184 },
    error: { asset: 'error.png', frame: 188 },
    interrupted: { asset: 'interrupted.png', frame: 180 }
  };

  function profileFor(config) {
    if (config.profile === undefined || config.profile === null || config.profile === '') {
      return Number(config.width) === 160 || Number(config.height) === 160 ? 'avatar-only' : 'screen';
    }
    return String(config.profile);
  }

  async function render(config) {
    if (!config || typeof config !== 'object' || Array.isArray(config)) throw new TypeError('avatar render config must be an object');
    var profile = profileFor(config);
    var size = profiles[profile];
    if (!size) throw new TypeError('profile must be screen or avatar-only');
    if ((config.width !== undefined && Number(config.width) !== size.width) ||
        (config.height !== undefined && Number(config.height) !== size.height)) {
      throw new TypeError('profile dimensions do not match the requested avatar render size');
    }

    var avatars = root.OpenBotAvatars;
    if (!avatars || !avatars.ids) throw new Error('OpenBotAvatars is not ready');
    var avatarId = String(config.avatar || 'orbit');
    if (avatars.ids.indexOf(avatarId) < 0) throw new TypeError('avatar must be an existing Bot Studio avatar id');
    var pose = String(config.pose || 'idle');
    if (poses.indexOf(pose) < 0) throw new TypeError('pose must be a supported Bot Studio companion pose');
    var color = config.color === undefined || config.color === null || config.color === ''
      ? avatars.meta[avatars.displayFor(avatarId)].tone
      : String(config.color);
    if (!/^#[0-9a-f]{6}$/i.test(color)) throw new TypeError('color must be a six-digit hexadecimal color');
    var name = config.name === undefined || config.name === null ? avatars.label(avatarId) : String(config.name);
    var status = config.status === undefined || config.status === null ? '' : String(config.status);
    var presence = config.presence === undefined || config.presence === null ? 'idle' : String(config.presence);

    var viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) viewport.setAttribute('content', 'width=' + size.width + ', height=' + size.height + ', initial-scale=1');
    document.documentElement.dataset.hardwareAvatarProfile = profile;
    document.body.dataset.hardwareAvatarProfile = profile;
    document.body.dataset.companionMode = 'lively';
    document.body.dataset.presence = presence;
    document.body.dataset.pageHidden = 'false';
    document.documentElement.style.setProperty('--avatar-halo-color', color.toLowerCase());

    var nameElement = document.getElementById('pet-name');
    var statusElement = document.getElementById('pet-status');
    var touch = document.getElementById('pet-touch');
    var stage = document.getElementById('pet-stage');
    var holder = document.getElementById('pet-avatar');
    var secondHolder = document.getElementById('pet-avatar-secondary');
    if (!nameElement || !statusElement || !touch || !stage || !holder) throw new Error('avatar render page is missing required elements');

    var secondaryAvatarId = config.secondaryAvatar !== undefined && config.secondaryAvatar !== null && config.secondaryAvatar !== ''
      ? String(config.secondaryAvatar)
      : null;
    if (secondaryAvatarId !== null && avatars.ids.indexOf(secondaryAvatarId) < 0) {
      throw new TypeError('secondaryAvatar must be an existing Bot Studio avatar id');
    }
    var secondaryPose = config.secondaryPose ? String(config.secondaryPose) : 'idle';
    if (poses.indexOf(secondaryPose) < 0) secondaryPose = 'idle';
    var secondaryColor = secondaryAvatarId
      ? (config.secondaryColor === undefined || config.secondaryColor === null || config.secondaryColor === ''
        ? avatars.meta[avatars.displayFor(secondaryAvatarId)].tone
        : String(config.secondaryColor))
      : null;
    if (secondaryColor !== null && !/^#[0-9a-f]{6}$/i.test(secondaryColor)) {
      throw new TypeError('secondaryColor must be a six-digit hexadecimal color');
    }

    delete document.body.dataset.hardwareAvatarReady;

    var petList = [];
    if (Array.isArray(config.pets) && config.pets.length > 0) {
      petList = config.pets.map(function (p) {
        var aId = String(p.avatar || 'orbit');
        if (avatars.ids.indexOf(aId) < 0) aId = 'orbit';
        var c = p.color && /^#[0-9a-f]{6}$/i.test(p.color)
          ? String(p.color)
          : avatars.meta[avatars.displayFor(aId)].tone;
        var n = p.name ? String(p.name) : avatars.label(aId);
        var ps = p.pose && poses.indexOf(p.pose) >= 0 ? String(p.pose) : 'idle';
        return { avatarId: aId, color: c, name: n, pose: ps };
      });
    } else {
      petList.push({ avatarId: avatarId, color: color, name: name, pose: pose });
      if (secondaryAvatarId) {
        var secName = config.secondaryName ? String(config.secondaryName) : (secondaryAvatarId ? avatars.label(secondaryAvatarId) : 'Bot');
        petList.push({ avatarId: secondaryAvatarId, color: secondaryColor, name: secName, pose: secondaryPose });
      }
    }

    var petCount = petList.length;
    var isDual = petCount === 2;
    var isMulti = petCount >= 3;

    document.documentElement.dataset.petCount = String(petCount);
    document.body.dataset.petCount = String(petCount);
    document.documentElement.dataset.dualPets = isDual ? 'true' : 'false';
    document.body.dataset.dualPets = isDual ? 'true' : 'false';
    document.documentElement.dataset.multiPets = isMulti ? 'true' : 'false';
    document.body.dataset.multiPets = isMulti ? 'true' : 'false';

    var secondaryName = config.secondaryName ? String(config.secondaryName) : (secondaryAvatarId ? avatars.label(secondaryAvatarId) : 'Bot');
    activeRenderState = {
      pose: pose,
      avatarId: avatarId,
      name: name,
      profile: profile,
      petCount: petCount,
      isDual: isDual,
      isMulti: isMulti,
      secondaryPose: secondaryPose,
      secondaryAvatarId: secondaryAvatarId,
      secondaryName: secondaryName,
      petList: petList
    };
    nameElement.textContent = name;
    statusElement.textContent = status;
    touch.dataset.pose = pose;
    stage.dataset.pose = pose;

    var holders = [
      holder,
      secondHolder,
      document.getElementById('pet-avatar-3'),
      document.getElementById('pet-avatar-4')
    ];
    for (var hIdx = 0; hIdx < holders.length; hIdx++) {
      var curHolder = holders[hIdx];
      if (!curHolder) continue;
      if (hIdx < petList.length) {
        curHolder.hidden = false;
        var curPet = petList[hIdx];
        curHolder.innerHTML = avatars.markup(curPet.avatarId, curPet.color, { size: 'companion', pose: curPet.pose });
        var curAv = curHolder.querySelector('.ob-avatar');
        if (curAv) avatars.setExpression(curAv, curPet.pose);
      } else {
        curHolder.hidden = true;
        curHolder.innerHTML = '';
      }
    }

    var avatar = holder.querySelector('.ob-avatar');
    if (!avatar) throw new Error('avatar markup did not produce a companion');
    Array.prototype.forEach.call(touch.querySelectorAll('svg.obf-avatar, svg.obx-avatar'), function (svg) {
      svg.dataset.motion = 'auto';
    });

    var plushPose = !isDual && profile === 'avatar-only' && avatar.dataset.displayAvatar === plushCharacter
      ? plushPoses[pose]
      : null;
    var plushImage = null;
    if (plushPose) {
      avatar.classList.add('hardware-plush-render');
      avatar.dataset.hardwarePlushPose = pose;
      avatar.style.setProperty('--hardware-plush-frame-size', plushPose.frame + 'px');
      plushImage = document.createElement('img');
      plushImage.className = 'hardware-plush-image';
      plushImage.alt = '';
      plushImage.setAttribute('aria-hidden', 'true');
      plushImage.draggable = false;
      plushImage.decoding = 'async';
      plushImage.src = 'assets/hardware-plush/' + plushPose.asset;
      if (typeof plushImage.decode === 'function') {
        await plushImage.decode();
      } else {
        await new Promise(function (resolve, reject) {
          plushImage.onload = resolve;
          plushImage.onerror = reject;
        });
      }
      if (plushImage.naturalWidth !== 1254 || plushImage.naturalHeight !== 1254) {
        throw new Error('hardware plush avatar asset has unexpected dimensions');
      }
      avatar.appendChild(plushImage);
      await new Promise(function (resolve) {
        root.requestAnimationFrame(function () {
          root.requestAnimationFrame(resolve);
        });
      });
    }
    // Agent HUD identities use local PNGs; wait for both themes before sampling.
    await Promise.all(Array.from(touch.querySelectorAll('img')).map(function (image) {
      if (typeof image.decode === 'function') return image.decode();
      if (image.complete) {
        if (image.naturalWidth > 0) return Promise.resolve();
        return Promise.reject(new Error('avatar image failed to load'));
      }
      return new Promise(function (resolve, reject) { image.onload = resolve; image.onerror = reject; });
    }));
    await new Promise(function (resolve) { root.requestAnimationFrame(function () { root.requestAnimationFrame(resolve); }); });
    document.body.dataset.hardwareAvatarReady = 'true';

    var svg = holder.querySelector('svg[data-character], svg[data-state]');
    var bounds = [nameElement, avatar, statusElement].map(function (element) {
      var rect = element.getBoundingClientRect();
      return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom };
    });
    return {
      profile: profile,
      avatar: avatarId,
      displayAvatar: avatar.dataset.displayAvatar,
      character: svg ? (svg.dataset.character || svg.dataset.state) : avatar.dataset.displayAvatar.slice(4),
      hardwarePlush: plushPose ? { asset: plushPose.asset, frame: plushPose.frame } : null,
      name: name,
      pose: pose,
      presence: presence,
      status: status,
      width: size.width,
      height: size.height,
      wrapperAnimation: root.getComputedStyle(avatar).animationName,
      artworkAnimation: root.getComputedStyle(holder.querySelector('.obf-body, .obx-body') || avatar).animationName,
      pageWidth: document.documentElement.clientWidth,
      pageHeight: document.documentElement.clientHeight,
      overflow: document.documentElement.scrollWidth > size.width || document.documentElement.scrollHeight > size.height,
      nameHasMarkup: Boolean(nameElement.querySelector('*')),
      bounds: bounds
    };
  }

  var activeRenderState = { pose: 'idle', avatarId: 'orbit', profile: 'avatar-only', isDual: false, secondaryPose: 'idle', secondaryAvatarId: null };
  var idleChoreography = [
    { expr: 'idle', state: 'idle', tx: -6, ty: 0, rot: -5, sx: 1.01, sy: 0.99, lx: -4.0, ly: -0.5, blink: 1 },
    { expr: 'idle', state: 'idle', tx: -10, ty: -3, rot: -8, sx: 0.98, sy: 1.03, lx: -5.0, ly: -1.5, blink: 1 },
    { expr: 'idle', state: 'idle', tx: -5, ty: 2, rot: -4, sx: 1.03, sy: 0.97, lx: -2.0, ly: 0, blink: 1 },
    { expr: 'idle', state: 'idle', tx: 0, ty: 4, rot: 0, sx: 1.07, sy: 0.92, lx: 0, ly: 1.0, blink: 0.12 },
    { expr: 'done', state: 'done', tx: 5, ty: -10, rot: 7, sx: 0.94, sy: 1.07, lx: 2.5, ly: -2.5, blink: 1, spark: 1 },
    { expr: 'done', state: 'done', tx: 9, ty: -12, rot: 10, sx: 0.95, sy: 1.06, lx: 3.5, ly: -3.0, blink: 1, spark: 1 },
    { expr: 'done', state: 'done', tx: 3, ty: -3, rot: -4, sx: 1.04, sy: 0.96, lx: 1.0, ly: -1.0, blink: 1, spark: 0.8 },
    { expr: 'done', state: 'done', tx: -6, ty: -11, rot: -9, sx: 0.94, sy: 1.07, lx: -3.0, ly: -2.5, blink: 1, spark: 1 },
    { expr: 'done', state: 'done', tx: -2, ty: -6, rot: 5, sx: 0.98, sy: 1.02, lx: 0, ly: -1.5, blink: 1, spark: 0.9 },
    { expr: 'done', state: 'done', tx: 0, ty: 3, rot: 0, sx: 1.06, sy: 0.93, lx: 0, ly: 0.5, blink: 1, spark: 0.4 },
    { expr: 'waiting', state: 'peeking', tx: 6, ty: -3, rot: 7, sx: 1.0, sy: 1.01, lx: 4.5, ly: -2.0, blink: 1 },
    { expr: 'waiting', state: 'peeking', tx: 10, ty: -5, rot: 10, sx: 0.97, sy: 1.04, lx: 5.5, ly: -3.0, blink: 1 },
    { expr: 'waiting', state: 'peeking', tx: 5, ty: -1, rot: 5, sx: 1.02, sy: 0.98, lx: 3.5, ly: 1.5, blink: 1 },
    { expr: 'waiting', state: 'peeking', tx: -6, ty: -4, rot: -8, sx: 0.98, sy: 1.03, lx: -4.5, ly: -2.0, blink: 1 },
    { expr: 'waiting', state: 'peeking', tx: -10, ty: -5, rot: -10, sx: 0.97, sy: 1.04, lx: -5.5, ly: 1.5, blink: 1 },
    { expr: 'idle', state: 'idle', tx: -4, ty: 2, rot: -3, sx: 1.04, sy: 0.96, lx: -1.5, ly: 0, blink: 0.12 },
    { expr: 'pet', state: 'done', tx: 6, ty: -8, rot: 9, sx: 0.96, sy: 1.05, lx: 2.5, ly: -2.0, blink: 1, spark: 1 },
    { expr: 'pet', state: 'done', tx: -7, ty: -9, rot: -9, sx: 0.95, sy: 1.06, lx: -2.5, ly: -2.0, blink: 1, spark: 1 },
    { expr: 'pet', state: 'done', tx: 7, ty: -8, rot: 9, sx: 0.96, sy: 1.05, lx: 2.0, ly: -1.5, blink: 1, spark: 1 },
    { expr: 'pet', state: 'done', tx: -5, ty: -5, rot: -6, sx: 0.99, sy: 1.02, lx: -1.5, ly: -1.0, blink: 1, spark: 0.7 },
    { expr: 'idle', state: 'idle', tx: 4, ty: 1, rot: 4, sx: 1.03, sy: 0.97, lx: 2.5, ly: 0.5, blink: 1 },
    { expr: 'idle', state: 'idle', tx: 2, ty: -2, rot: 2, sx: 1.0, sy: 1.0, lx: 1.5, ly: -0.5, blink: 0.15 },
    { expr: 'idle', state: 'idle', tx: 0, ty: -1, rot: -1, sx: 1.0, sy: 1.0, lx: -1.0, ly: 0, blink: 1 },
    { expr: 'idle', state: 'idle', tx: -2, ty: 0, rot: -2, sx: 1.0, sy: 1.0, lx: -2.0, ly: 0, blink: 1 }
  ];

  // 24-frame Dual-Pet Choreography on ESP32:
  // Phase 1 (0..3): 散步走动 + 互相打量 (Walking & looking at each other)
  // Phase 2 (4..7): 歪头好奇聊天 (Curious head-tilt O-mouth chatting)
  // Phase 3 (8..12): 跑向中间贴贴碰头 + 开心双跳 + 闪光 (Run to center, cheek nuzzle & happy double jump)
  // Phase 4 (13..17): 跷跷板交替欢跳舞蹈 (Seesaw alternating jump dance)
  // Phase 5 (18..23): 向两侧溜达跑开 + 同步跳跃招手回位 (Roam outward, sync jump & smooth loop)
  var dualChoreography = [
    { a: { expr: 'idle', state: 'idle', tx: -5, ty: -2, rot: -5, sx: 0.99, sy: 1.02, lx: 3.5, ly: -0.5, blink: 1 },
      b: { expr: 'idle', state: 'idle', tx: 5, ty: 2, rot: 5, sx: 1.03, sy: 0.97, lx: -3.5, ly: -0.5, blink: 1 } },
    { a: { expr: 'idle', state: 'idle', tx: -2, ty: 2, rot: -2, sx: 1.03, sy: 0.97, lx: 4.0, ly: -1.0, blink: 1 },
      b: { expr: 'idle', state: 'idle', tx: 2, ty: -3, rot: 3, sx: 0.98, sy: 1.03, lx: -4.0, ly: -1.0, blink: 1 } },
    { a: { expr: 'idle', state: 'idle', tx: 1, ty: -3, rot: 4, sx: 0.98, sy: 1.03, lx: 4.5, ly: -1.0, blink: 0.14 },
      b: { expr: 'idle', state: 'idle', tx: -1, ty: 2, rot: -3, sx: 1.03, sy: 0.97, lx: -4.5, ly: -1.0, blink: 1 } },
    { a: { expr: 'idle', state: 'idle', tx: 3, ty: 1, rot: 5, sx: 1.02, sy: 0.98, lx: 4.0, ly: 0, blink: 1 },
      b: { expr: 'idle', state: 'idle', tx: -3, ty: -2, rot: -5, sx: 0.99, sy: 1.02, lx: -4.0, ly: 0, blink: 0.14 } },
    { a: { expr: 'waiting', state: 'peeking', tx: 4, ty: -3, rot: 9, sx: 0.98, sy: 1.03, lx: 5.0, ly: -2.0, blink: 1 },
      b: { expr: 'idle', state: 'idle', tx: -4, ty: 1, rot: -7, sx: 1.01, sy: 0.99, lx: -4.5, ly: -1.5, blink: 1 } },
    { a: { expr: 'waiting', state: 'peeking', tx: 5, ty: -5, rot: 11, sx: 0.97, sy: 1.04, lx: 5.5, ly: -2.5, blink: 1 },
      b: { expr: 'waiting', state: 'peeking', tx: -5, ty: -2, rot: -9, sx: 0.99, sy: 1.02, lx: -5.0, ly: -2.0, blink: 1 } },
    { a: { expr: 'idle', state: 'idle', tx: 3, ty: 1, rot: 6, sx: 1.02, sy: 0.98, lx: 4.5, ly: -1.0, blink: 1 },
      b: { expr: 'waiting', state: 'peeking', tx: -6, ty: -5, rot: -11, sx: 0.97, sy: 1.04, lx: -5.5, ly: -2.5, blink: 1 } },
    { a: { expr: 'waiting', state: 'peeking', tx: 4, ty: 3, rot: 4, sx: 1.06, sy: 0.93, lx: 4.0, ly: 0.5, blink: 0.15 },
      b: { expr: 'waiting', state: 'peeking', tx: -4, ty: 3, rot: -4, sx: 1.06, sy: 0.93, lx: -4.0, ly: 0.5, blink: 0.15 } },
    { a: { expr: 'done', state: 'done', tx: 9, ty: -9, rot: 8, sx: 0.94, sy: 1.07, lx: 3.5, ly: -2.5, blink: 1, spark: 1 },
      b: { expr: 'done', state: 'done', tx: -9, ty: -9, rot: -8, sx: 0.94, sy: 1.07, lx: -3.5, ly: -2.5, blink: 1, spark: 1 } },
    { a: { expr: 'pet', state: 'done', tx: 11, ty: -12, rot: 10, sx: 0.95, sy: 1.06, lx: 3.0, ly: -3.0, blink: 1, spark: 1 },
      b: { expr: 'pet', state: 'done', tx: -11, ty: -12, rot: -10, sx: 0.95, sy: 1.06, lx: -3.0, ly: -3.0, blink: 1, spark: 1 } },
    { a: { expr: 'pet', state: 'done', tx: 8, ty: -5, rot: -5, sx: 1.03, sy: 0.97, lx: 2.5, ly: -1.5, blink: 1, spark: 0.9 },
      b: { expr: 'pet', state: 'done', tx: -8, ty: -5, rot: 5, sx: 1.03, sy: 0.97, lx: -2.5, ly: -1.5, blink: 1, spark: 0.9 } },
    { a: { expr: 'done', state: 'done', tx: 10, ty: -11, rot: 9, sx: 0.95, sy: 1.06, lx: 3.0, ly: -2.5, blink: 1, spark: 1 },
      b: { expr: 'done', state: 'done', tx: -10, ty: -11, rot: -9, sx: 0.95, sy: 1.06, lx: -3.0, ly: -2.5, blink: 1, spark: 1 } },
    { a: { expr: 'done', state: 'done', tx: 5, ty: 2, rot: 3, sx: 1.05, sy: 0.94, lx: 2.0, ly: 0, blink: 1, spark: 0.5 },
      b: { expr: 'done', state: 'done', tx: -5, ty: 2, rot: -3, sx: 1.05, sy: 0.94, lx: -2.0, ly: 0, blink: 1, spark: 0.5 } },
    { a: { expr: 'done', state: 'done', tx: 0, ty: -13, rot: -9, sx: 0.92, sy: 1.09, lx: 1.5, ly: -3.0, blink: 1, spark: 1 },
      b: { expr: 'waiting', state: 'peeking', tx: 2, ty: 4, rot: 6, sx: 1.07, sy: 0.92, lx: -3.5, ly: -3.5, blink: 1 } },
    { a: { expr: 'done', state: 'done', tx: -2, ty: -9, rot: -6, sx: 0.96, sy: 1.04, lx: 1.0, ly: -2.0, blink: 1, spark: 0.7 },
      b: { expr: 'pet', state: 'done', tx: 1, ty: 2, rot: 4, sx: 1.04, sy: 0.96, lx: -2.5, ly: -2.0, blink: 1 } },
    { a: { expr: 'waiting', state: 'peeking', tx: -2, ty: 4, rot: -6, sx: 1.07, sy: 0.92, lx: 3.5, ly: -3.5, blink: 1 },
      b: { expr: 'done', state: 'done', tx: 0, ty: -13, rot: 9, sx: 0.92, sy: 1.09, lx: -1.5, ly: -3.0, blink: 1, spark: 1 } },
    { a: { expr: 'pet', state: 'done', tx: -1, ty: 2, rot: -4, sx: 1.04, sy: 0.96, lx: 2.5, ly: -2.0, blink: 1 },
      b: { expr: 'done', state: 'done', tx: 2, ty: -9, rot: 6, sx: 0.96, sy: 1.04, lx: -1.0, ly: -2.0, blink: 1, spark: 0.7 } },
    { a: { expr: 'idle', state: 'idle', tx: -6, ty: -3, rot: -8, sx: 0.98, sy: 1.03, lx: -4.0, ly: -1.0, blink: 1 },
      b: { expr: 'idle', state: 'idle', tx: 6, ty: -3, rot: 8, sx: 0.98, sy: 1.03, lx: 4.0, ly: -1.0, blink: 1 } },
    { a: { expr: 'waiting', state: 'peeking', tx: -8, ty: -5, rot: -10, sx: 0.97, sy: 1.04, lx: -5.0, ly: -2.0, blink: 1 },
      b: { expr: 'waiting', state: 'peeking', tx: 8, ty: -5, rot: 10, sx: 0.97, sy: 1.04, lx: 5.0, ly: -2.0, blink: 1 } },
    { a: { expr: 'idle', state: 'idle', tx: -4, ty: 3, rot: -3, sx: 1.06, sy: 0.93, lx: 0, ly: 0.5, blink: 0.14 },
      b: { expr: 'idle', state: 'idle', tx: 4, ty: 3, rot: 3, sx: 1.06, sy: 0.93, lx: 0, ly: 0.5, blink: 0.14 } },
    { a: { expr: 'done', state: 'done', tx: -2, ty: -10, rot: 6, sx: 0.94, sy: 1.07, lx: 0, ly: -2.5, blink: 1, spark: 1 },
      b: { expr: 'done', state: 'done', tx: 2, ty: -10, rot: -6, sx: 0.94, sy: 1.07, lx: 0, ly: -2.5, blink: 1, spark: 1 } },
    { a: { expr: 'pet', state: 'done', tx: -1, ty: -6, rot: -5, sx: 0.98, sy: 1.03, lx: 0, ly: -1.5, blink: 1, spark: 0.8 },
      b: { expr: 'pet', state: 'done', tx: 1, ty: -6, rot: 5, sx: 0.98, sy: 1.03, lx: 0, ly: -1.5, blink: 1, spark: 0.8 } },
    { a: { expr: 'idle', state: 'idle', tx: -3, ty: 1, rot: -3, sx: 1.02, sy: 0.98, lx: 2.0, ly: 0, blink: 1 },
      b: { expr: 'idle', state: 'idle', tx: 3, ty: 1, rot: 3, sx: 1.02, sy: 0.98, lx: -2.0, ly: 0, blink: 1 } },
    { a: { expr: 'idle', state: 'idle', tx: -4, ty: 0, rot: -4, sx: 1.0, sy: 1.0, lx: 3.0, ly: 0, blink: 1 },
      b: { expr: 'idle', state: 'idle', tx: 4, ty: 0, rot: 4, sx: 1.0, sy: 1.0, lx: -3.0, ly: 0, blink: 1 } },
    // Phase 6 (24..27): 抛接能量星 (Tossing & catching energy star)
    { a: { expr: 'done', state: 'done', tx: 10, ty: -13, rot: 11, sx: 0.93, sy: 1.08, lx: 4.5, ly: -3.0, blink: 1, spark: 1 },
      b: { expr: 'waiting', state: 'peeking', tx: -3, ty: 2, rot: 5, sx: 1.05, sy: 0.95, lx: -3.5, ly: -3.0, blink: 1 } },
    { a: { expr: 'done', state: 'done', tx: 6, ty: -7, rot: 7, sx: 0.98, sy: 1.03, lx: 4.0, ly: -2.0, blink: 1, spark: 0.8 },
      b: { expr: 'waiting', state: 'peeking', tx: -1, ty: -4, rot: 8, sx: 1.0, sy: 1.02, lx: -3.0, ly: -3.5, blink: 1 } },
    { a: { expr: 'pet', state: 'done', tx: 4, ty: 1, rot: 4, sx: 1.03, sy: 0.97, lx: 3.5, ly: -1.0, blink: 1 },
      b: { expr: 'done', state: 'done', tx: -8, ty: -12, rot: -10, sx: 0.93, sy: 1.09, lx: -2.5, ly: -2.5, blink: 1, spark: 1 } },
    { a: { expr: 'pet', state: 'done', tx: 2, ty: 2, rot: 2, sx: 1.04, sy: 0.96, lx: 2.5, ly: 0, blink: 1, spark: 0.6 },
      b: { expr: 'done', state: 'done', tx: -5, ty: -6, rot: -5, sx: 0.98, sy: 1.03, lx: -2.0, ly: -1.5, blink: 1, spark: 1 } },
    // Phase 7 (28..31): 软萌小憩并排打瞌睡 (Gentle mochi loaf nap)
    { a: { expr: 'idle', state: 'idle', tx: -3, ty: 4, rot: -2, sx: 1.08, sy: 0.90, lx: 1.0, ly: 2.0, blink: 0.1 },
      b: { expr: 'idle', state: 'idle', tx: 3, ty: 4, rot: 2, sx: 1.08, sy: 0.90, lx: -1.0, ly: 2.0, blink: 0.1 } },
    { a: { expr: 'idle', state: 'idle', tx: -3, ty: 5, rot: -3, sx: 1.10, sy: 0.88, lx: 1.0, ly: 2.5, blink: 0.08 },
      b: { expr: 'idle', state: 'idle', tx: 3, ty: 5, rot: 3, sx: 1.10, sy: 0.88, lx: -1.0, ly: 2.5, blink: 0.08 } },
    { a: { expr: 'idle', state: 'idle', tx: -3, ty: 4, rot: -2, sx: 1.08, sy: 0.90, lx: 1.0, ly: 2.0, blink: 0.1 },
      b: { expr: 'idle', state: 'idle', tx: 3, ty: 4, rot: 2, sx: 1.08, sy: 0.90, lx: -1.0, ly: 2.0, blink: 0.1 } },
    { a: { expr: 'idle', state: 'idle', tx: -3, ty: 2, rot: 0, sx: 1.04, sy: 0.96, lx: 1.5, ly: 1.0, blink: 0.4 },
      b: { expr: 'idle', state: 'idle', tx: 3, ty: 2, rot: 0, sx: 1.04, sy: 0.96, lx: -1.5, ly: 1.0, blink: 0.4 } },
    // Phase 8 (32..35): 打喷嚏与打哈欠 (A: sneeze, B: yawn)
    { a: { expr: 'waiting', state: 'peeking', tx: -3, ty: -5, rot: -14, sx: 0.96, sy: 1.12, lx: 1.0, ly: -3.0, blink: 1 },
      b: { expr: 'idle', state: 'idle', tx: 3, ty: -6, rot: 3, sx: 1.06, sy: 1.15, lx: -2.0, ly: -2.5, blink: 0.2 } },
    { a: { expr: 'done', state: 'done', tx: 4, ty: 6, rot: 16, sx: 1.12, sy: 0.80, lx: 2.5, ly: 3.0, blink: 1, spark: 1 },
      b: { expr: 'idle', state: 'idle', tx: 3, ty: -6, rot: 3, sx: 1.06, sy: 1.15, lx: -2.0, ly: -2.5, blink: 0.1 } },
    { a: { expr: 'pet', state: 'done', tx: 1, ty: 1, rot: 4, sx: 1.02, sy: 0.98, lx: 1.5, ly: 0, blink: 1, spark: 0.5 },
      b: { expr: 'idle', state: 'idle', tx: 2, ty: 1, rot: 1, sx: 1.02, sy: 0.98, lx: -1.0, ly: 0, blink: 1 } },
    { a: { expr: 'idle', state: 'idle', tx: 0, ty: 0, rot: 0, sx: 1.0, sy: 1.0, lx: 0, ly: 0, blink: 1 },
      b: { expr: 'idle', state: 'idle', tx: 0, ty: 0, rot: 0, sx: 1.0, sy: 1.0, lx: 0, ly: 0, blink: 1 } },
    // Phase 9 (36..39): 杂技后空翻与敲敲屏幕 (A: flip, B: tap glass)
    { a: { expr: 'done', state: 'done', tx: -2, ty: 6, rot: 0, sx: 1.16, sy: 0.74, lx: 0, ly: 2.0, blink: 1 },
      b: { expr: 'pet', state: 'done', tx: 4, ty: -4, rot: -4, sx: 0.96, sy: 1.08, lx: 0, ly: -1.5, blink: 1 } },
    { a: { expr: 'done', state: 'done', tx: -2, ty: -16, rot: -180, sx: 0.95, sy: 1.08, lx: 0, ly: -3.0, blink: 1, spark: 1 },
      b: { expr: 'pet', state: 'done', tx: 4, ty: 2, rot: -2, sx: 1.04, sy: 0.96, lx: 0, ly: 0, blink: 1 } },
    { a: { expr: 'pet', state: 'done', tx: -2, ty: 2, rot: -360, sx: 1.08, sy: 0.92, lx: 0, ly: 1.0, blink: 1, spark: 1 },
      b: { expr: 'done', state: 'done', tx: 4, ty: -4, rot: -4, sx: 0.96, sy: 1.08, lx: 0, ly: -1.5, blink: 1, spark: 0.6 } },
    { a: { expr: 'done', state: 'done', tx: 0, ty: 0, rot: 0, sx: 1.0, sy: 1.0, lx: 0, ly: 0, blink: 1 },
      b: { expr: 'idle', state: 'idle', tx: 0, ty: 0, rot: 0, sx: 1.0, sy: 1.0, lx: 0, ly: 0, blink: 1 } }
  ];

  function applyStepToAvatar(avatar, step, basePose, stepIndex) {
    if (!avatar || !step || avatar.classList.contains('hardware-plush-render')) return;
    var isIdle = basePose === 'idle';
    var expr = isIdle ? step.expr : basePose;
    var svgState = isIdle ? step.state : ({ thinking: 'thinking', waiting: 'peeking', done: 'done', pet: 'done', wave: 'peeking', cheer: 'done', interrupted: 'rest', rest: 'rest' }[expr] || 'idle');
    if (root.OpenBotAvatars && typeof root.OpenBotAvatars.setExpression === 'function') {
      root.OpenBotAvatars.setExpression(avatar, expr);
    }
    var svg = avatar.querySelector('svg.obf-avatar, svg.obx-avatar');
    if (svg) svg.setAttribute('data-state', svgState);
    avatar.style.transformOrigin = '50% 62%';
    avatar.style.setProperty('transform', 'translate(' + step.tx + 'px, ' + step.ty + 'px) rotate(' + step.rot + 'deg) scale(' + step.sx + ', ' + step.sy + ')', 'important');
    avatar.style.setProperty('--ob-look-x', step.lx + 'px');
    avatar.style.setProperty('--ob-look-y', step.ly + 'px');
    Array.prototype.forEach.call(avatar.querySelectorAll('.obf-body, .obx-body'), function (body) {
      body.style.setProperty('transform', 'translate(0px, 0px) scale(1, 1)', 'important');
    });
    Array.prototype.forEach.call(avatar.querySelectorAll('.obf-face-sway, .obx-face, .ob-face'), function (face) {
      face.style.transformOrigin = '64px 74px';
      face.style.setProperty('transform', 'translate(' + (step.lx * 0.95).toFixed(2) + 'px, ' + (step.ly * 0.95).toFixed(2) + 'px) rotate(' + (step.rot * 0.5).toFixed(2) + 'deg)', 'important');
    });
    Array.prototype.forEach.call(avatar.querySelectorAll('.obf-gaze, .obx-pupil'), function (pupil) {
      pupil.style.setProperty('transform', 'translate(' + (step.lx * 0.85).toFixed(2) + 'px, ' + (step.ly * 0.85).toFixed(2) + 'px)', 'important');
    });
    Array.prototype.forEach.call(avatar.querySelectorAll('.obf-eye-lid, .obx-lid'), function (lid) {
      lid.style.transformBox = 'fill-box';
      lid.style.transformOrigin = 'center';
      lid.style.setProperty('transform', step.blink < 1 ? 'scaleY(' + step.blink + ')' : 'scaleY(1)', 'important');
    });
    Array.prototype.forEach.call(avatar.querySelectorAll('.obf-spark, .obx-spark'), function (spark) {
      spark.style.setProperty('display', step.spark ? 'inline' : 'none', 'important');
      spark.style.setProperty('opacity', step.spark ? String(step.spark) : '0', 'important');
      spark.style.transformBox = 'fill-box';
      spark.style.transformOrigin = 'center';
      spark.style.setProperty('transform', step.spark ? 'scale(1.22) rotate(' + (stepIndex * 18) + 'deg)' : 'scale(1)', 'important');
    });
  }

  function applyHardwareOverlays(stepIndex) {
    var bubbleEl = document.getElementById('hw-pet-bubble');
    var badgeEl = document.getElementById('hw-pet-badge');
    if (!bubbleEl || !badgeEl) return;
    if (activeRenderState.profile !== 'avatar-only') {
      bubbleEl.hidden = true;
      badgeEl.hidden = true;
      return;
    }
    var pList = activeRenderState.petList || [{ name: activeRenderState.name, pose: activeRenderState.pose }];
    var petCount = activeRenderState.petCount || pList.length;

    var waitingPet = pList.find(function (p) { return p.pose === 'waiting'; });
    var errorPet = pList.find(function (p) { return p.pose === 'error' || p.pose === 'interrupted'; });
    var workingPet = pList.find(function (p) { return p.pose === 'working' || p.pose === 'thinking' || p.pose === 'queued'; });
    var donePet = pList.find(function (p) { return p.pose === 'done'; });

    var tone = 'chat', text = '', badge = '';
    if (waitingPet) {
      tone = 'waiting';
      text = '⚠️ ' + String(waitingPet.name).slice(0, 8) + ' · 待审批!';
      badge = '!';
    } else if (errorPet) {
      tone = 'error';
      text = '❗ ' + String(errorPet.name).slice(0, 8) + ' · 需查看';
      badge = '!';
    } else if (workingPet) {
      tone = 'working';
      text = '⚡ ' + String(workingPet.name).slice(0, 8) + ' · 执行中…';
      badge = '⚡';
    } else if (donePet) {
      tone = 'done';
      text = '✅ ' + String(donePet.name).slice(0, 8) + ' · 已完成!';
      badge = '✨';
    } else if (petCount >= 3) {
      if (stepIndex < 6) {
        text = '✨ ' + petCount + ' 宠在岗 · 效率加倍';
        badge = String(petCount);
      } else if (stepIndex < 12) {
        text = '♥ 团队协同 · 元气满满';
        badge = '♥';
      } else if (stepIndex < 18) {
        text = '🎵 欢快互动 · 桌面守护';
        badge = '♪';
      } else if (stepIndex < 24) {
        text = '👀 敏锐巡检 · 随时待命';
        badge = '👀';
      } else {
        text = '⭐ ' + petCount + ' 宠齐聚 · Bot Studio';
        badge = '⭐';
      }
    } else if (activeRenderState.isDual) {
      var nameA = String(activeRenderState.name || 'Bot Studio').slice(0, 8);
      var nameB = String(activeRenderState.secondaryName || '伙伴').slice(0, 8);
      if (stepIndex < 4) {
        text = '👀 ' + nameA + ' & ' + nameB;
        badge = '';
      } else if (stepIndex < 8) {
        text = stepIndex < 6 ? '💬 嘿，一起盯任务!' : '♪ 收到！随时待命';
        badge = '💬';
      } else if (stepIndex < 13) {
        text = '♥ 贴贴充能 · 元气满满';
        badge = '♥';
      } else if (stepIndex < 17) {
        text = '🎵 欢快蹦跶 · 效率加倍';
        badge = '♪';
      } else if (stepIndex < 21) {
        text = '🏃 你追我赶 · 活力守护';
        badge = '✨';
      } else if (stepIndex < 24) {
        text = '🔔 双宠待命 · Bot Studio';
        badge = '';
      } else if (stepIndex < 28) {
        text = '⭐ 能量星抛接 · 默契满分';
        badge = '⭐';
      } else if (stepIndex < 32) {
        text = '💤 双宠小憩中 · 呼噜呼噜';
        badge = '💤';
      } else if (stepIndex < 36) {
        text = '🤧 趣味自发 · 打喷嚏与打哈欠';
        badge = '✨';
      } else {
        text = '🤸 杂技后空翻 · 敲敲屏幕';
        badge = '🤸';
      }
    } else {
      var nameA = String(activeRenderState.name || 'Bot Studio').slice(0, 8);
      if (stepIndex >= 4 && stepIndex < 10) {
        text = '✨ ' + nameA + ' · 元气满满';
      } else if (stepIndex >= 10 && stepIndex < 15) {
        text = '👀 ' + nameA + ' · 盯任务中';
      } else if (stepIndex >= 16 && stepIndex < 20) {
        text = '♥ ' + nameA + ' · 贴心陪伴';
      } else if (stepIndex >= 24 && stepIndex < 28) {
        text = '⭐ ' + nameA + ' · 能量满满';
      } else if (stepIndex >= 28 && stepIndex < 32) {
        text = '💤 ' + nameA + ' · 呼噜小憩中';
      } else if (stepIndex >= 32 && stepIndex < 36) {
        text = '🤧 ' + nameA + ' · 阿嚏！';
      } else if (stepIndex >= 36) {
        text = '🤸 ' + nameA + ' · 帅气后空翻';
      } else {
        text = '🔔 ' + nameA + ' · 待命中';
      }
    }
    if (text) {
      bubbleEl.hidden = false;
      bubbleEl.dataset.tone = tone;
      bubbleEl.textContent = text;
    } else {
      bubbleEl.hidden = true;
    }
    if ((activeRenderState.isDual || petCount >= 3) && badge) {
      badgeEl.hidden = false;
      badgeEl.textContent = badge;
      var popScale = (stepIndex % 2 === 0) ? 1.08 : 0.94;
      badgeEl.style.transform = 'translateX(-50%) translateY(' + (stepIndex % 2 === 0 ? '-3px' : '1px') + ') scale(' + popScale + ')';
    } else {
      badgeEl.hidden = true;
    }
  }

  function applyChoreography(timeMs) {
    var holder = document.getElementById('pet-avatar');
    var avatar = holder && holder.querySelector('.ob-avatar');
    if (!avatar || avatar.classList.contains('hardware-plush-render')) return;
    if (activeRenderState.petCount >= 3) {
      var holders = [
        holder,
        document.getElementById('pet-avatar-secondary'),
        document.getElementById('pet-avatar-3'),
        document.getElementById('pet-avatar-4')
      ];
      var stepBase = Math.max(0, Math.round(timeMs / 125));
      for (var pIdx = 0; pIdx < activeRenderState.petList.length && pIdx < holders.length; pIdx++) {
        var h = holders[pIdx];
        var av = h && h.querySelector('.ob-avatar');
        if (!av) continue;
        var sIndex = (stepBase + pIdx * 4) % idleChoreography.length;
        var sFrame = idleChoreography[sIndex];
        var baseP = activeRenderState.petList[pIdx].pose || 'idle';
        applyStepToAvatar(av, sFrame, baseP, sIndex);
      }
      applyHardwareOverlays(stepBase % idleChoreography.length);
      return;
    }
    if (activeRenderState.isDual) {
      var secondHolder = document.getElementById('pet-avatar-secondary');
      var secondAvatar = secondHolder && secondHolder.querySelector('.ob-avatar');
      var dIndex = Math.max(0, Math.round(timeMs / 125)) % dualChoreography.length;
      var dFrame = dualChoreography[dIndex];
      applyStepToAvatar(avatar, dFrame.a, activeRenderState.pose || 'idle', dIndex);
      if (secondAvatar) applyStepToAvatar(secondAvatar, dFrame.b, activeRenderState.secondaryPose || 'idle', dIndex);
      applyHardwareOverlays(dIndex);
      return;
    }
    var stepIndex = Math.max(0, Math.round(timeMs / 125)) % idleChoreography.length;
    var step = idleChoreography[stepIndex];
    applyStepToAvatar(avatar, step, activeRenderState.pose || 'idle', stepIndex);
    applyHardwareOverlays(stepIndex);
  }

  function setTime(milliseconds) {
    var time = Number(milliseconds);
    if (!Number.isFinite(time) || time < 0 || time > 600000) throw new TypeError('time must be a number between 0 and 600000 milliseconds');
    var animations = document.getAnimations();
    animations.forEach(function (animation) {
      try {
        animation.pause();
        animation.currentTime = time;
      } catch (_) {}
    });
    applyChoreography(time);
    return { timeMs: time, animationCount: animations.length };
  }

  root.OpenBotHardwareAvatar = { render: render, setTime: setTime };
})(window);
