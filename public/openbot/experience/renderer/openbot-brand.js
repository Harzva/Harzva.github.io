/* OpenBot product identity: the selected OB ligature. Bot characters stay separate. */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.OpenBotBrand = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';
  var viewBox = '100 300 1050 660';
  var color = '#193F2A';
  var dockInk = '#DDF2A5';
  // Bot Studio unified BS silhouette: vertical pill-eye B flowing into serpentine S.
  var path = 'M198 432C198 391 219 370 260 370H431C513 370 574 423 574 508C574 559 549 598 515 617C558 639 597 683 597 743C597 780 584 812 568 834C579 838 603 839 642 839H852C911 839 944 807 944 748C944 698 910 677 842 677H764C638 677 580 621 580 530C580 432 645 379 760 379H911C975 379 1017 366 1052 340C1031 409 982 452 900 452H764C695 452 662 479 662 529C662 579 695 602 766 602H852C969 602 1030 655 1030 748C1030 857 960 921 847 921H670C594 921 543 907 507 884C486 893 461 898 433 898H260C219 898 198 877 198 836Z '
    + 'M344 448H415A64 64 0 0 1 415 576H344A64 64 0 0 1 344 448Z '
    + 'M349 674H419A69 69 0 0 1 419 812H349A69 69 0 0 1 349 674Z';
  var colors = { moss: color, blue: color, lime: dockInk, white: '#FFFFFF', ink: '#24262B', current: 'currentColor' };
  function fillOf(variant) {
    return colors[variant] || color;
  }
  function shape(variant) {
    return '<path fill="' + fillOf(variant) + '" fill-rule="evenodd" d="' + path + '"/>';
  }
  function staticEyes(variant) {
    var fill = fillOf(variant);
    return '<g aria-hidden="true">'
      + '<circle cx="359" cy="512" r="32" fill="' + fill + '"/>'
      + '<circle cx="359" cy="743" r="35" fill="' + fill + '"/>'
      + '</g>';
  }
  // Product-only motion detail. Static exports render non-animated eyes so
  // Dock, favicon and website icons retain the character silhouette cleanly.
  function eyes(variant) {
    var dot = fillOf(variant);
    return '<g class="ob-brand-eyes" data-ob-brand-eyes="true" aria-hidden="true">'
      + '<path class="ob-brand-eye-backing" d="M344 448H415A64 64 0 0 1 415 576H344A64 64 0 0 1 344 448Z" fill="transparent"/>'
      + '<path class="ob-brand-eye-backing" d="M349 674H419A69 69 0 0 1 419 812H349A69 69 0 0 1 349 674Z" fill="transparent"/>'
      + '<circle class="ob-brand-eye" data-ob-brand-eye="upper" cx="359" cy="512" r="32" fill="' + dot + '"/>'
      + '<circle class="ob-brand-eye" data-ob-brand-eye="lower" cx="359" cy="743" r="35" fill="' + dot + '"/>'
      + '</g>';
  }
  function svg(variant, decorative, withEyes) {
    var includeEyes = withEyes === true && decorative !== false;
    return '<svg xmlns="http://www.w3.org/2000/svg" class="ob-icon ob-brand-mark" data-ob-icon="openbot"' + (includeEyes ? ' data-ob-brand-eyes="true"' : '') + ' viewBox="' + viewBox + '" width="1050" height="660" '
      + (decorative === false ? 'role="img" aria-label="Bot Studio"><title>Bot Studio</title>' : 'aria-hidden="true" focusable="false">')
      + shape(variant) + (includeEyes ? eyes(variant) : staticEyes(variant)) + '</svg>';
  }
  function iconSvg() {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024" role="img" aria-label="Bot Studio"><title>Bot Studio</title>'
      + '<rect x="96" y="96" width="832" height="832" rx="188" fill="' + color + '"/>'
      + '<svg x="164" y="294" width="696" height="437" viewBox="' + viewBox + '">' + shape('lime') + staticEyes('lime') + '</svg></svg>';
  }
  return { color: color, viewBox: viewBox, path: path, svg: svg, iconSvg: iconSvg };
});
