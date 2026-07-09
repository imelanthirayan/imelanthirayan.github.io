/* ═══════════════════════════════════════════════════════════════
   SHARED SITE CHROME — Nav + Footer
   Included once per module page via:
     <script src="../js/partials.js"></script><script>writeSiteNav();</script>
     …
     <script>writeSiteFooter('Section Name');</script>
   Update the markup here once and every module page picks it up.
═══════════════════════════════════════════════════════════════ */
(function (global) {

  // Every module page now lives two levels deep under /modules/<section>/,
  // so links (index.html, css/, js/…) always resolve with '../../'.
  function relPrefix() {
    var p = window.location.pathname;
    if (p.indexOf('/modules/') !== -1) return '../../';
    return '';
  }

  function writeSiteNav() {
    var base = relPrefix();
    document.write(
      '<nav id="navbar" class="fixed top-0 inset-x-0 z-50 nav-scrolled">' +
        '<div class="max-w-7xl mx-auto px-5 md:px-8">' +
          '<div class="flex items-center justify-between h-16">' +
            '<a href="' + base + 'index.html" class="flex items-center gap-2.5">' +
              '<div class="w-8 h-8 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">' +
                '<i data-lucide="brain" class="w-4 h-4 text-white"></i>' +
              '</div>' +
              '<span class="nav-logo-text font-bold text-base transition-colors duration-300">AI Concepts Playground</span>' +
            '</a>' +
            '<div class="hidden md:flex items-center gap-2">' +
              '<a href="' + base + 'index.html#learn" class="nav-link px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hover:bg-slate-100 dark:hover:bg-slate-800">All Modules</a>' +
              '<button data-dark-toggle class="nav-dark-btn p-2 rounded-lg transition-all hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Toggle dark mode">' +
                '<i data-lucide="moon" class="icon-moon w-4 h-4 hidden"></i>' +
                '<i data-lucide="sun"  class="icon-sun  w-4 h-4"></i>' +
              '</button>' +
            '</div>' +
            '<button id="mobileMenuBtn" class="md:hidden p-2 rounded-lg nav-dark-btn transition-all hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Open menu">' +
              '<i data-lucide="menu" class="w-5 h-5"></i>' +
            '</button>' +
          '</div>' +
        '</div>' +
        '<div id="mobileMenu" class="hidden md:hidden absolute inset-x-0 top-16 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl px-6 py-5">' +
          '<div class="flex flex-col gap-2">' +
            '<a href="' + base + 'index.html" class="nav-link text-sm font-medium py-2.5 border-b border-slate-100 dark:border-slate-800 transition-colors">← Back to Home</a>' +
            '<a href="' + base + 'index.html#learn" class="nav-link text-sm font-medium py-2.5 border-b border-slate-100 dark:border-slate-800 transition-colors">All Modules</a>' +
            '<div class="flex items-center justify-between py-2">' +
              '<span class="text-sm nav-link">Dark Mode</span>' +
              '<button data-dark-toggle class="nav-dark-btn p-2 rounded-lg transition-all">' +
                '<i data-lucide="moon" class="icon-moon w-4 h-4 hidden"></i>' +
                '<i data-lucide="sun"  class="icon-sun  w-4 h-4"></i>' +
              '</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</nav>'
    );
  }

  function writeSiteFooter(tagline) {
    var base = relPrefix();
    document.write(
      '<footer class="border-t border-slate-200 dark:border-slate-800 py-10 px-6">' +
        '<div class="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">' +
          '<a href="' + base + 'index.html" class="flex items-center gap-2">' +
            '<div class="w-6 h-6 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-md flex items-center justify-center">' +
              '<i data-lucide="brain" class="w-3 h-3 text-white"></i>' +
            '</div>' +
            '<span class="font-bold text-slate-600 dark:text-slate-400 text-sm">AI Concepts Playground</span>' +
          '</a>' +
          '<p class="text-slate-400 dark:text-slate-600 text-xs">' + tagline + '</p>' +
          '<div class="flex items-center gap-4">' +
            '<a href="' + base + 'index.html#learn" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-sm transition-colors">All Modules</a>' +
          '</div>' +
        '</div>' +
      '</footer>'
    );
  }

  // Richer footer variant used by the Vector Index Explorer pages
  // (adds a "Developed by Elanthirayan Madhavan" link + inline dark-mode toggle).
  function writeSiteFooterVI() {
    var base = relPrefix();
    document.write(
      '<footer class="border-t border-slate-200 dark:border-slate-800 py-8 px-6">' +
        '<div class="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">' +
          '<a href="' + base + 'index.html" class="flex items-center gap-2.5">' +
            '<div class="w-7 h-7 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-lg flex items-center justify-center shadow">' +
              '<i data-lucide="brain" class="w-3.5 h-3.5 text-white"></i>' +
            '</div>' +
            '<span class="font-bold text-slate-700 dark:text-slate-300 text-sm">AI Concepts Playground</span>' +
          '</a>' +
          '<p class="text-slate-400 dark:text-slate-600 text-sm">Vector Index Visual Explorer · Interactive 3D demos</p>' +
          '<div class="flex items-center gap-4">' +
            '<a href="https://imelanthirayan.github.io/" target="_blank" rel="noopener" class="flex items-center gap-1.5 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">' +
              '<i data-lucide="user" class="w-3.5 h-3.5"></i>' +
              'Developed by Elanthirayan Madhavan' +
            '</a>' +
            '<button data-dark-toggle class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all" aria-label="Toggle dark mode">' +
              '<i data-lucide="moon" class="icon-moon w-4 h-4 hidden"></i>' +
              '<i data-lucide="sun"  class="icon-sun  w-4 h-4"></i>' +
            '</button>' +
          '</div>' +
        '</div>' +
      '</footer>'
    );
  }

  global.writeSiteNav       = writeSiteNav;
  global.writeSiteFooter    = writeSiteFooter;
  global.writeSiteFooterVI  = writeSiteFooterVI;

})(window);
