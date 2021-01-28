sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/UIComponent",
	"sap/m/library",
	"sap/m/MessageToast"
], function (Controller, UIComponent, mobileLibrary, MessageToast) {
	"use strict";

	// shortcut for sap.m.URLHelper
	var URLHelper = mobileLibrary.URLHelper;
	var oSmartFilterBar = null;

	return Controller.extend("ey.sap.fin.cs.deferredtaxrollfwd.controller.BaseController", {
		/**
		 * Convenience method for accessing the router.
		 * @public
		 * @returns {sap.ui.core.routing.Router} the router for this component
		 */
		getRouter: function () {
			return UIComponent.getRouterFor(this);
		},

		/**
		 * Convenience method for getting the view model by name.
		 * @public
		 * @param {string} [sName] the model name
		 * @returns {sap.ui.model.Model} the model instance
		 */
		getModel: function (sName) {
			return this.getView().getModel(sName);
		},

		/**
		 * Convenience method for setting the view model.
		 * @public
		 * @param {sap.ui.model.Model} oModel the model instance
		 * @param {string} sName the model name
		 * @returns {sap.ui.mvc.View} the view instance
		 */
		setModel: function (oModel, sName) {
			return this.getView().setModel(oModel, sName);
		},

		/**
		 * Getter for the resource bundle.
		 * @public
		 * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
		 */
		getResourceBundle: function () {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle();
		},

		setFilterBar: function (oSmartFiltBar) {
			oSmartFilterBar = oSmartFiltBar;
		},

		getFilterBar: function () {
			return oSmartFilterBar;
		},

		getBusyDialog: function () {
			var oAppView = this.getView().getParent();
			var oComponent = this.getOwnerComponent();

			if (!oComponent._oBusyDialog) {
				oComponent._oBusyDialog = sap.ui.xmlfragment("trfBusyDialog", "ey.sap.fin.cs.deferredtaxrollfwd.fragment.BusyDialog", this);
				oAppView.addDependent(oComponent._oBusyDialog);
			}

			return oComponent._oBusyDialog;
		},

		/**
		 * Perform Cross App Navigation .
		 * @returns - NA
		 * @param {string} [sSemanticObject] Semantic Object Name
		 * @param {string} [sAction] Action Name
		 * @param {boolean} [bOpenInNewTab] True if the App should open in 'New Browser Tab'
		 * @param {object} [oNavigationParams] Parameters to be passed in Navigations
		 */
		performCrossAppNavigation: function (sSemanticObject, sAction, bOpenInNewTab, oNavigationParams) {
			var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
			var that = this;

			var sIntent = sSemanticObject + "-" + sAction;
			oNavigationParams = oNavigationParams || {};

			oCrossAppNavigator.isIntentSupported([sIntent])
				.done(function (aResponses) {})
				.fail(function (oError) {
					MessageToast.show(that.getResourceBundle().getText("invalidIntentNavigation"));
				});
			// generate the Hash for next app
			var hash = (oCrossAppNavigator && oCrossAppNavigator.hrefForExternal({
				target: {
					semanticObject: sSemanticObject,
					action: sAction
				},
				params: oNavigationParams
			})) || "";

			//Generate a  URL for the second application
			var url = window.location.href.split("#")[0] + hash;

			//Navigate to second app
			sap.m.URLHelper.redirect(url, bOpenInNewTab);
		},

		/**
		 * Event handler when the share by E-Mail button has been clicked
		 * @public
		 */
		onShareEmailPress: function () {
			var oViewModel = (this.getModel("objectView") || this.getModel("worklistView"));
			URLHelper.triggerEmail(
				null,
				oViewModel.getProperty("/shareSendEmailSubject"),
				oViewModel.getProperty("/shareSendEmailMessage")
			);
		},

		/**
		 * Adds a history entry in the FLP page history
		 * @public
		 * @param {object} oEntry An entry object to add to the hierachy array as expected from the ShellUIService.setHierarchy method
		 * @param {boolean} bReset If true resets the history before the new entry is added
		 */
		addHistoryEntry: (function () {
			var aHistoryEntries = [];

			return function (oEntry, bReset) {
				if (bReset) {
					aHistoryEntries = [];
				}

				var bInHistory = aHistoryEntries.some(function (oHistoryEntry) {
					return oHistoryEntry.intent === oEntry.intent;
				});

				if (!bInHistory) {
					aHistoryEntries.push(oEntry);
					this.getOwnerComponent().getService("ShellUIService").then(function (oService) {
						oService.setHierarchy(aHistoryEntries);
					});
				}
			};
		})()

	});

});