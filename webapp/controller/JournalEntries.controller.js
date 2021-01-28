sap.ui.define([
	"./BaseController",
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	"../model/formatter"
], function (BaseController, Controller, Filter, FilterOperator, MessageBox, MessageToast, formatter) {
	"use strict";

	return BaseController.extend("ey.sap.fin.cs.deferredtaxrollfwd.controller.JournalEntries", {
		// set the formatter
		formatter: formatter,
		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf ey.sap.fin.cs.deferredtaxrollfwd.view.JournalEntries
		 */
		onInit: function () {
			this._oSmartTable = this.getView().byId("idJournalEntriesTable");
			this.oRouter = this.getOwnerComponent().getRouter();
			this.oRouter.getRoute("JournalEntries").attachMatched(this._onRouteMatched, this);
		},

		_onRouteMatched: function () {
			let oJournalEntryDataModel = this.getModel("JournalEntryData");

			//	No warning Message Box is opened
			this.bIsMessageBoxOpen = false;

			// Flag - FALSE if page load | TRUE if table refresh
			this.bTableRefresh = false;

			if (oJournalEntryDataModel && oJournalEntryDataModel.getData()) {
				this._oSmartTable.rebindTable();
			} else {
				let oRouter = this.getRouter();
				this.getBusyDialog().open();
				oRouter.navTo("mainreport", {}, true);
			}
		},

		/***********************************************************************************************/
		/*********************************	Private Methods	********************************************/
		/**********************************************************************************************/

		_onAdjustJECol: function () {
			var oTable = this.getView().byId("idJournalEntriesTable").getTable();
			var aCols = oTable.getColumns();
			for (var i = aCols.length - 1; i >= 0; i--) {
				oTable.autoResizeColumn(i);
			}

			this.getBusyDialog().close();
		},

		_findTableSumRow: function () {
			let oTable = this.getView().byId("idJournalEntriesTable");
			let oInnerTable = oTable.getTable();
			let aTableRows = oInnerTable.getRows();
			let sVisibleRowCount = oInnerTable.getVisibleRowCount();
			if (!aTableRows[sVisibleRowCount - 1].getBindingContext()) {
				for (let i = 0; i < (aTableRows.length + 1); i++) {
					if (!aTableRows[i].getBindingContext()) {
						return i - 1;
					}
				}
			}

			return sVisibleRowCount - 1;
		},

		_findTableSumRowData: function (index) {
			let oTable = this.getView().byId("idJournalEntriesTable").getTable();
			let sumRowData;

			if (oTable.getRows()[index] && oTable.getRows()[index].getBindingContext()) {
				let sBindingPath = oTable.getRows()[index].getBindingContext().sPath;
				sumRowData = oTable.getModel().getProperty(sBindingPath);
			}
			return sumRowData;
		},

		_compareSyncedValues: function (sumRowData, bTableRefresh) {
			let oJournalEntryDataModel = this.getModel("JournalEntryData").getData();
			let oHeaderValue = this.getView().byId("idJEValueHeader");
			// IF SUMMED row data not available, do not execute code
			if ((sumRowData && sumRowData.LocalCurrency !== oJournalEntryDataModel.selectedCurrency && !sumRowData.AmountInLocalCurrency) ||
				(sumRowData && sumRowData.GroupCurrency !== oJournalEntryDataModel.selectedCurrency && !sumRowData.AmountInGroupCurrency)) {
				MessageToast.show(this.getResourceBundle().getText("errorCurrencyColumnNotSelected"));
				return;
			}

			if ((sumRowData && oJournalEntryDataModel.selectedCurrency === sumRowData.LocalCurrency && parseInt(
					oJournalEntryDataModel.Value, [10]) !== parseInt(sumRowData.AmountInLocalCurrency, [10])) || (sumRowData &&
					oJournalEntryDataModel.selectedCurrency === sumRowData.GroupCurrency && parseInt(oJournalEntryDataModel.Value, [10]) !== parseInt(
						sumRowData.AmountInGroupCurrency, [10]))) {
				oHeaderValue.setState("Warning");
				if (!this.bIsMessageBoxOpen) {
					this._initializeWarningMessageBox(bTableRefresh);
				}
			} else {
				oHeaderValue.setState("Success");
			}
		},

		_initializeWarningMessageBox: function (bTableRefresh) {
			this.bIsMessageBoxOpen = true;
			let that = this;
			MessageBox.warning(this.getResourceBundle().getText("errorMsgSumValueDiffTableSync"), {
				actions: [MessageBox.Action.OK],
				onClose: function (sAction) {
					that.bIsMessageBoxOpen = false;
				}
			});
		},

		/***********************************************************************************************/
		/*********************************	Event Handlers	********************************************/
		/**********************************************************************************************/

		onBeforeRebindJournalEntries: function (oEvent) {
			let oModel = this.getView().getModel("JournalEntryData"),
				aUserFilter = oEvent.getParameter("bindingParams").filters,
				oFFilter;

			// Dynamically modify the filter operator for Fiscal Year depending on ehat column is selected.
			let oFiscalYearFilterOperator = FilterOperator.EQ;
			if (oModel.getProperty("/bIsOpeningBalanceEntry")) {
				oFiscalYearFilterOperator = FilterOperator.LT;
			}

			let aMandFilters = [new Filter("ConsolidationGroup", FilterOperator.EQ, oModel.getProperty("/ConsolidationGroup")),
				new Filter("GLAccount", FilterOperator.EQ, oModel.getProperty("/GLAccount")),
				new Filter("PeriodMode", FilterOperator.EQ, oModel.getProperty("/PeriodMode")),
				new Filter("ConsolidationVersion", FilterOperator.EQ, oModel.getProperty("/ConsolidationVersion")),
				new Filter("FiscalPeriod", FilterOperator.BT, oModel.getProperty("/PeriodFrom"), oModel.getProperty("/PeriodTo")),
				new Filter("FiscalYear", oFiscalYearFilterOperator, oModel.getProperty("/FiscalYear")),
				new Filter("RefConsolidationDocumentType", FilterOperator.EQ, oModel.getProperty("/RefConsolidationDocumentType"))
			];

			// ADD Intention Filter if Selected
			if (oModel.getProperty("/SelectedIntention")) {
				aMandFilters.push(new Filter("SpecialPeriod", FilterOperator.LE, oModel.getProperty("/SelectedIntention")));
			} else {
				aMandFilters.push(new Filter("SpecialPeriod", FilterOperator.EQ, ''));
			}

			// if user filters available - add them to mandatory filters.
			if (aUserFilter.length > 0) {
				//  Using the spread operator to concat the array content.
				aMandFilters = [...aMandFilters, ...aUserFilter];
			}

			// MANDATORY FILTERS
			let aMandtFilters = new Filter({
				filters: aMandFilters,
				and: true
			});

			// CONSOLIDATION LEDGER FILTERS
			let aCnsldtnLedgers = oModel.getProperty("/ConsolidationLedger"),
				aCnsldtnLedgerFilter = [];
			for (let i = 0; i < aCnsldtnLedgers.length; i++) {
				aCnsldtnLedgerFilter.push(new Filter("ConsolidationLedger", FilterOperator.EQ, aCnsldtnLedgers[i]));
			}
			let oCnsldtnLedgerFilter = new Filter({
				filters: aCnsldtnLedgerFilter
			});

			// TRANSACTION TYPE FILTERS
			let aTrnscnTypes = oModel.getProperty("/FinancialTransactionType"),
				aTrnscnTypesFilter = [];
			for (let i = 0; i < aTrnscnTypes.length; i++) {
				aTrnscnTypesFilter.push(new Filter("FinancialTransactionType", FilterOperator.EQ, aTrnscnTypes[i]));
			}
			let oTrnscnTypesFilter = new Filter({
				filters: aTrnscnTypesFilter
			});

			oFFilter = new Filter({
				filters: [aMandtFilters, oCnsldtnLedgerFilter, oTrnscnTypesFilter],
				and: true
			});

			var encodeURI = encodeURIComponent("datetime'2018-12-31T00:00:00'");
			var sBindingPath =
				"/xEY1xSAV_C_CnsldtnJrnlEntry(P_ConsolidationUnitHierarchy='$',P_ConsolidationPrftCtrHier='$',P_ConsolidationSegmentHier='$',P_KeyDate=" +
				encodeURI + ")/Results";

			this.getView().byId("idJournalEntriesTable").setTableBindingPath(sBindingPath);
			var oBindingParams = oEvent.getParameter("bindingParams");
			oBindingParams.filters = [oFFilter];
		},

		onPressConsDoc: function (oEvent) {
			let oBindedContext = oEvent.getSource().getBindingContext(),
				sConsolidationDocumentNumber = oBindedContext.getProperty("RefConsolidationDocumentNumber"),
				sCompanyCode = oBindedContext.getProperty("CompanyCode"),
				iCounter = sCompanyCode;
			while (iCounter.length < 4) {
				iCounter = "0" + iCounter;
			}
			var sFiscalYear = oBindedContext.getProperty("PostingDate").getFullYear();

			var oNavigationParams = {
				"AccountingDocument": sConsolidationDocumentNumber,
				"CompanyCode": iCounter,
				"FiscalYear": sFiscalYear
			};
			this.performCrossAppNavigation("AccountingDocument", "manage", true, oNavigationParams);
		},

		onJEntriesDataReceived: function (oEvent) {
			this.getBusyDialog().open();
			var oIntervalCall = window.setInterval(function (e) {
				this._onAdjustJECol();
				this._compareSyncedValues(this._findTableSumRowData(this._findTableSumRow()), this.bTableRefresh);
				window.clearInterval(oIntervalCall);

			}.bind(this), 1000);
		},

		onPressJEDataSync: function (oEvent) {
			// Flag - FALSE if page load | TRUE if table refresh
			this.bTableRefresh = true;
			this._oSmartTable.rebindTable();
			// this._compareSyncedValues(this._findTableSumRowData(this._findTableSumRow()), true);

		}

	});
});