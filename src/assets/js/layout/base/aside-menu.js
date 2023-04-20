"use strict";

var KTLayoutAsideMenu = function() {
    // Private properties
    var _element;
    var _menuObject;

	// Initialize
	var _init = function() {
		var menuDesktopMode = (KTUtil.attr(_element, 'data-menu-dropdown') === '1' ? 'dropdown' : 'accordion');
        var scroll;

		if (KTUtil.attr(_element, 'data-menu-scroll') === '1') {
			scroll = {
				rememberPosition: true, // remember position on page reload
				height: function() { // calculate available scrollable area height
					var height = parseInt(KTUtil.getViewPort().height);

					if (KTUtil.isBreakpointUp('lg')) {
						height = height - KTLayoutBrand.getHeight();
					}

					height = height - (parseInt(KTUtil.css(_element, 'marginBottom')) + parseInt(KTUtil.css(_element, 'marginTop')));

					return height;
				}
			};
		}

		_menuObject = new KTMenu(_element, {
			// Vertical scroll
			scroll: scroll,

			// Submenu setup
			submenu: {
				desktop: menuDesktopMode,
				tablet: 'accordion', // menu set to accordion in tablet mode
				mobile: 'accordion' // menu set to accordion in mobile mode
			},

			// Accordion setup
			accordion: {
				expandAll: false // allow having multiple expanded accordions in the menu
			}
		});

        // Disable menu click if aside is fixed and minimized
        _menuObject.on('submenuToggle', function(menu) {
            if (KTLayoutAside.isMinimized() === true  && KTLayoutAside.isHoverable() === false) {
                return false;
            }
        });

        // Close aside offcanvas panel before page reload On tablet and mobile
        _menuObject.on('linkClick', function(menu) {
            if (KTUtil.isBreakpointDown('lg')) { // Tablet and mobile mode
                KTLayoutAside.getOffcanvas().hide(); // Hide offcanvas after general link click
            }
        });
	}

    // Public methods
	return {
		init: function(id) {
            _element = KTUtil.getById(id);

            if (!_element) {
                return;
            }

            // Initialize menu
            _init();
		},

		getElement: function() {
			return _element;
		},

        getMenu: function() {
			return _menuObject;
		},

        pauseDropdownHover: function(time) {
			if (_menuObject) {
				_menuObject.pauseDropdownHover(time);
			}
		},

		closeMobileOffcanvas: function() {
			if (_menuObject && KTUtil.isMobileDevice()) {
				_menuObject.hide();
			}
		}
	};
}();



export default KTLayoutAsideMenu;