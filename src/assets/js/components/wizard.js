"use strict";

import KTUtil from "./util";

// Component Definition
var KTWizard = function(elementId, options) {
    // Main object
    var the = this;
    var init = false;

    // Get element object
    var element = KTUtil.getById(elementId);
    var body = KTUtil.getBody();

    if (!element) {
        return;
    }

    // Default options
    var defaultOptions = {
        startStep: 1,
        clickableSteps: false // to make steps clickable this set value true and add data-wizard-clickable="true" in HTML for class="wizard" element
    };

    ////////////////////////////
    // ** Private Methods  ** //
    ////////////////////////////

    var Plugin = {
        /**
         * Construct
         */

        construct: function(options) {
            if (KTUtil.data(element).has('wizard')) {
                the = KTUtil.data(element).get('wizard');
            } else {
                // reset menu
                Plugin.init(options);

                // build menu
                Plugin.build();

                KTUtil.data(element).set('wizard', the);
            }

            return the;
        },

        /**
         * Init wizard
         */
        init: function(options) {
            the.element = element;
            the.events = [];

            // merge default and user defined options
            the.options = KTUtil.deepExtend({}, defaultOptions, options);

            // Elements
            the.steps = KTUtil.findAll(element, '[data-wizard-type="step"]');

            the.btnSubmit = KTUtil.find(element, '[data-wizard-type="action-submit"]');
            the.btnNext = KTUtil.find(element, '[data-wizard-type="action-next"]');
            the.btnPrev = KTUtil.find(element, '[data-wizard-type="action-prev"]');
            the.btnLast = KTUtil.find(element, '[data-wizard-type="action-last"]');
            the.btnFirst = KTUtil.find(element, '[data-wizard-type="action-first"]');

            // Variables
            the.events = [];
            the.currentStep = 1;
            the.stopped = false;
            the.totalSteps = the.steps.length;

            // Init current step
            if (the.options.startStep > 1) {
                Plugin.goTo(the.options.startStep);
            }

            // Init UI
            Plugin.updateUI();
        },

        /**
         * Build Form Wizard
         */
        build: function() {
            // Next button event handler
            KTUtil.addEvent(the.btnNext, 'click', function(e) {
                e.preventDefault();
                Plugin.goTo(Plugin.getNextStep(), true);
            });

            // Prev button event handler
            KTUtil.addEvent(the.btnPrev, 'click', function(e) {
                e.preventDefault();
                Plugin.goTo(Plugin.getPrevStep(), true);
            });

            // First button event handler
            KTUtil.addEvent(the.btnFirst, 'click', function(e) {
                e.preventDefault();
                Plugin.goTo(Plugin.getFirstStep(), true);
            });

            // Last button event handler
            KTUtil.addEvent(the.btnLast, 'click', function(e) {
                e.preventDefault();
                Plugin.goTo(Plugin.getLastStep(), true);
            });

            if (the.options.clickableSteps === true) {
                KTUtil.on(element, '[data-wizard-type="step"]', 'click', function() {
                    var index = KTUtil.index(this) + 1;
                    if (index !== the.currentStep) {
                        Plugin.goTo(index, true);
                    }
                });
            }
        },

        /**
         * Handles wizard click wizard
         */
        goTo: function(number, eventHandle) {
            console.log('go to:' + number);

            // Skip if this step is already shown
            if (number === the.currentStep || number > the.totalSteps || number < 0) {
                return;
            }

            // Validate step number
            if (number) {
                number = parseInt(number);
            } else {
                number = Plugin.getNextStep();
            }

            // Before next and prev events
            var callback;

            if (eventHandle === true) {
                if (number > the.currentStep) {
                    callback = Plugin.eventTrigger('beforeNext');
                } else {
                    callback = Plugin.eventTrigger('beforePrev');
                }
            }

            // Skip if stopped
            if (the.stopped === true) {
                the.stopped = false;
                return;
            }

            // Continue if no exit
            if (callback !== false) {
                // Before change
                if (eventHandle === true) {
                    Plugin.eventTrigger('beforeChange');
                }

                // Set current step
                the.currentStep = number;

                Plugin.updateUI();

                // Trigger change event
                if (eventHandle === true) {
                    Plugin.eventTrigger('change');
                }
            }

            // After next and prev events
            if (eventHandle === true) {
                if (number > the.startStep) {
                    Plugin.eventTrigger('afterNext');
                } else {
                    Plugin.eventTrigger('afterPrev');
                }
            }

            return the;
        },

        /**
         * Cancel
         */
        stop: function() {
            the.stopped = true;
        },

        /**
         * Resume
         */
        start: function() {
            the.stopped = false;
        },

        /**
         * Check last step
         */
        isLastStep: function() {
            return the.currentStep === the.totalSteps;
        },

        /**
         * Check first step
         */
        isFirstStep: function() {
            return the.currentStep === 1;
        },

        /**
         * Check between step
         */
        isBetweenStep: function() {
            return Plugin.isLastStep() === false && Plugin.isFirstStep() === false;
        },

        /**
         * Go to the first step
         */
        updateUI: function() {
            var stepType = '';
            var index = the.currentStep - 1;

            if (Plugin.isLastStep()) {
                stepType = 'last';
            } else if (Plugin.isFirstStep()) {
                stepType = 'first';
            } else {
                stepType = 'between';
            }

            KTUtil.attr(the.element, 'data-wizard-state', stepType);

            // Steps
            var steps = KTUtil.findAll(the.element, '[data-wizard-type="step"]');

            if (steps && steps.length > 0) {
                for (var i = 0, len = steps.length; i < len; i++) {
                    if (i == index) {
                        KTUtil.attr(steps[i], 'data-wizard-state', 'current');
                    } else {
                        if (i < index) {
                            KTUtil.attr(steps[i], 'data-wizard-state', 'done');
                        } else {
                            KTUtil.attr(steps[i], 'data-wizard-state', 'pending');
                        }
                    }
                }
            }

            // Steps Info
            var stepsInfo = KTUtil.findAll(the.element, '[data-wizard-type="step-info"]');
            if (stepsInfo &&stepsInfo.length > 0) {
                for (var i = 0, len = stepsInfo.length; i < len; i++) {
                    if (i == index) {
                        KTUtil.attr(stepsInfo[i], 'data-wizard-state', 'current');
                    } else {
                        KTUtil.removeAttr(stepsInfo[i], 'data-wizard-state');
                    }
                }
            }

            // Steps Content
            var stepsContent = KTUtil.findAll(the.element, '[data-wizard-type="step-content"]');
            if (stepsContent&& stepsContent.length > 0) {
                for (var i = 0, len = stepsContent.length; i < len; i++) {
                    if (i == index) {
                        KTUtil.attr(stepsContent[i], 'data-wizard-state', 'current');
                    } else {
                        KTUtil.removeAttr(stepsContent[i], 'data-wizard-state');
                    }
                }
            }
        },

        /**
         * Get next step
         */
        getNextStep: function() {
            if (the.totalSteps >= (the.currentStep + 1)) {
                return the.currentStep + 1;
            } else {
                return the.totalSteps;
            }
        },

        /**
         * Get prev step
         */
        getPrevStep: function() {
            if ((the.currentStep - 1) >= 1) {
                return the.currentStep - 1;
            } else {
                return 1;
            }
        },

        /**
         * Trigger events
         */
        eventTrigger: function(name, nested) {
            //KTUtil.triggerCustomEvent(name);
            for (var i = 0; i < the.events.length; i++) {
                var event = the.events[i];
                if (event.name == name) {
                    if (event.one == true) {
                        if (event.fired == false) {
                            the.events[i].fired = true;
                            return event.handler.call(this, the);
                        }
                    } else {
                        return event.handler.call(this, the);
                    }
                }
            }
        },

        addEvent: function(name, handler, one) {
            the.events.push({
                name: name,
                handler: handler,
                one: one,
                fired: false
            });

            return the;
        }
    };

    //////////////////////////
    // ** Public Methods ** //
    //////////////////////////

    /**
     * Set default options
     */

    the.setDefaults = function(options) {
        defaultOptions = options;
    };

    /**
     * Go to the next step
     */
    the.goNext = function(eventHandle) {
        return Plugin.goTo(Plugin.getNextStep(), eventHandle);
    };

    /**
     * Go to the prev step
     */
    the.goPrev = function(eventHandle) {
        return Plugin.goTo(Plugin.getPrevStep(),eventHandle);
    };

    /**
     * Go to the last step
     */
    the.goLast = function(eventHandle) {
        return Plugin.goTo(Plugin.getLastStep(), eventHandle);
    };

    /**
     * Go to the first step
     */
    the.goFirst = function(eventHandle) {
        return Plugin.goTo(Plugin.getFirstStep(), eventHandle);
    };

    /**
     * Go to a step
     */
    the.goTo = function(number, eventHandle) {
        return Plugin.goTo(number, eventHandle);
    };

    /**
     * Cancel step
     */
    the.stop = function() {
        return Plugin.stop();
    };

    /**
     * Resume step
     */
    the.start = function() {
        return Plugin.start();
    };

    /**
     * Get current step number
     */
    the.getStep = function() {
        return the.currentStep;
    };

    /**
     * Check last step
     */
    the.isLastStep = function() {
        return Plugin.isLastStep();
    };

    /**
     * Check first step
     */
    the.isFirstStep = function() {
        return Plugin.isFirstStep();
    };

    /**
     * Attach event
     */
    the.on = function(name, handler) {
        return Plugin.addEvent(name, handler);
    };

    /**
     * Attach event that will be fired once
     */
    the.one = function(name, handler) {
        return Plugin.addEvent(name, handler, true);
    };

    // Construct plugin
    Plugin.construct.apply(the, [options]);

    return the;
};

// webpack support
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = KTWizard;
}

export default KTWizard;