/* global QUnit */

QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"ey/sap/fin/cs/deferredtaxrollfwd/test/integration/AllJourneys"
	], function () {
		QUnit.start();
	});
});
