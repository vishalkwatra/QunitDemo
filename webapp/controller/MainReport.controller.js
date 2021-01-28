sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"../model/formatter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageToast",
	"sap/m/MessageBox",
	"sap/ui/core/ListItem"
], function (BaseController, JSONModel, formatter, Filter, FilterOperator, MessageToast, MessageBox, ListItem) {
	"use strict";

	return BaseController.extend("ey.sap.fin.cs.deferredtaxrollfwd.controller.MainReport", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the MainReport controller is instantiated.
		 * @public
		 */
		onInit: function () {
			this.oRouter = this.getOwnerComponent().getRouter();
			this.oRouter.getRoute("mainreport").attachMatched(this._onRouteMatched, this);

			this._fetchGlobalParameters();
			this._fetchAdjustmentReasons();

			// Defaulting Reporting Type Model
			this.getView().setModel(new JSONModel({
				results: [{
					key: "RGAAP",
					text: this.getI18nText("sBtnTextReportingGAAP")
				}, {
					key: "SGAAP",
					text: this.getI18nText("sBtnTextStatutoryReporting")
				}]
			}), "modelReportingType");

		},

		/* =========================================================== */
		/* internal methods  -PRIVATE                                  */
		/* =========================================================== */

		_onRouteMatched: function () {
			this.getBusyDialog().close();

			// Declare global variables here
			this.oGlobalSmartTable = this.getView().byId("idTRFMainRepSmartTable");

			// Freeze 1st Column
			this.oGlobalSmartTable.getTable().setFixedColumnCount(1);

			// Hide an entry from personalization - Not recommended
			// this.oGlobalSmartTable._oPersController.attachDialogAfterOpen(function (oEvent) {
			// 	let oPopup = this._oDialog.oPopup;
			// 	let oPersPanels = oPopup.getContent().getAggregation("panels");
			// 	let oColumnPanel = oPersPanels[oPersPanels.map(item => item.getProperty("type").indexOf("column") !== -1).indexOf(true)];
			// 	let oTable = oColumnPanel._oTable;
			// 	let oTableModel = oTable.getModel();
			// 	let oGlAccountListEntry = oTable.getItems()[oTable.getSelectedItems().map(item => item.getCells()[0].getBindingContext().getObject()
			// 		.columnKey === "GLAccount").indexOf(true)];
			// 	oTableModel.getData().items.splice(oTable.getItems().map(item => item === oGlAccountListEntry).indexOf(true), 1);
			// 	oTableModel.refresh(true);

			// 	// if (oGlAccountListEntry) {
			// 	// 	oGlAccountListEntry.setVisible(false);
			// 	// }
			// });
		},

		_fetchGlobalParameters: function () {
			var that = this;
			var oModel = this.getOwnerComponent().getModel();

			let oReconDataModel = new JSONModel();
			this.getOwnerComponent().setModel(oReconDataModel, "viewConfigDataModel");

			oModel.callFunction("/GlobalParameter", {
				method: "GET",
				success: function (oData) {
					// Saving global parameters in Model
					that.getView().getModel("viewConfigDataModel").setData({
						"globalParameters": oData
					});
					// that._setFilterBarParameters(oData);

					// // If 'VARIANT' is being used, Do Not over write global parameters
					// let oFilterBar = that.getView().byId("idTRFMainRepSmartFilterBar");
					// if (!oFilterBar.getCurrentVariantId()) {
					// 	that._setFilterBarParameters(oData);
					// }
				},
				error: function (oError) {
					MessageBox.error(that.getI18nText("errorReadingGlobalParameters"));
				}
			});
		},

		_setFilterBarParameters: function (oGlobalParameters) {
			let oView = this.getView(),
				oCurrency = oView.byId("idCurrency");

			if (oGlobalParameters.ConsolidationUnit) {
				oView.byId("idConsUnit").setSelectedKey(oGlobalParameters.ConsolidationUnit);
				oCurrency.setVisible(true);
				this._fetchCurrencyData(true);
				this.fetchReconLedgerData();
			}

			if (oGlobalParameters.FiscalYear) {
				// Generating a Date mid-year 6th of June - with provided fiscal year.
				let oFiscalYearDate = new Date("06/06/".concat(oGlobalParameters.FiscalYear.toString()));
				oView.byId("idFiscalYearFilter").setDateValue(oFiscalYearDate);
			}

			if (oGlobalParameters.Intention) {
				oView.byId("idIntentionComboBox").setSelectedKey(oGlobalParameters.Intention);
			}
			// Fetch data for Intention. This is independent of Intention data stored in Global Parameter App.
			this._fetchIntentionData();

			if (oGlobalParameters.PeriodFrom) {
				oView.byId("idPeriodFromInput").setValue(formatter.convertStringToInt(oGlobalParameters.PeriodFrom));
			}

			if (oGlobalParameters.PeriodTo) {
				oView.byId("idPeriodToInput").setValue(formatter.convertStringToInt(oGlobalParameters.PeriodTo));
			}

			if (oGlobalParameters.LocalCurrencyType && oGlobalParameters.LocalCurrency) {
				oCurrency.setSelectedKey(oGlobalParameters.LocalCurrency);
			} else {
				oCurrency.setSelectedKey(oGlobalParameters.GroupCurrency);
			}

		},

		_fetchAdjustmentReasons: function () {
			let oModel = this.getOwnerComponent().getModel();
			let sServiceURL = "/xEY1xSAV_C_Recon_Adj_Reason";
			let that = this;
			oModel.read(sServiceURL, {
				method: "GET",
				success: function (oData, oResponse) {
					var oReconModel = that.getModel("viewConfigDataModel");
					oReconModel.getData().adjustmentReason = oData.results;
					oReconModel.refresh();
				},
				error: function (oError) {
					if (parseInt(oError.statusCode, [10]) !== 404) {
						MessageToast.show(that.getI18nText("adjReasonServiceCallError"));
					}
				}
			});
		},

		// _addTextLabelToSumRow: function (oTable) {
		// 	var aTableRows = oTable.getRows();

		// 	try {
		// 		for (let i = 0; i < aTableRows.length; i++) {
		// 			if (aTableRows[i].getCells()[0].getBindingInfo("value") && !aTableRows[i].getCells()[0].getValue()) {

		// 				// If 'Total' text exist, Remove it and Add again
		// 				let data = aTableRows[i].getBindingContext().getObject();
		// 				data[Object.keys(data).find(key => data[key] === this.getI18nText("BalanceCheckSumLabel"))] = "";

		// 				aTableRows[i].getCells()[0].setValue(this.getI18nText("BalanceCheckSumLabel"));
		// 				break;
		// 			}

		// 			if (aTableRows[i].getCells()[0].getBindingInfo("text") && !aTableRows[i].getCells()[0].getText()) {

		// 				// If 'Total' text exist, Remove it and Add again
		// 				let data = aTableRows[i].getBindingContext().getObject();
		// 				data[Object.keys(data).find(key => data[key] === this.getI18nText("BalanceCheckSumLabel"))] = "";

		// 				aTableRows[i].getCells()[0].setText(this.getI18nText("BalanceCheckSumLabel"));
		// 				break;
		// 			}
		// 		}
		// 	} catch (oError) {
		// 		this.getBusyDialog().close();
		// 	}

		// },

		getI18nText: function (sTextKey) {
			return this.getResourceBundle().getText(sTextKey);
		},

		_fetchCurrencyData: function (bIsVariantCall) {
			var oView = this.getView(),
				consKey = oView.byId("idConsUnit").getSelectedKey(),
				oFilter = new Filter("ConsolidationUnit", FilterOperator.EQ, consKey),
				oServiceCallModel = this.getModel(),
				that = this,
				oCurrencyCtrl = oView.byId("idCurrType"),
				oCurrControl = oView.byId("idCurrency");

			oCurrencyCtrl.setVisible(true);
			oCurrControl.setBusy(true);
			oServiceCallModel.read("/xEY1xSAV_C_CurrLocalGroupVH", {
				method: "GET",
				filters: [oFilter],
				success: function (oData, oResponse) {
					oCurrControl.setBusy(false);
					that.setModel(new JSONModel(oData), "currLocalGroupVHModel");
					if (!bIsVariantCall && oData.results.length > 0) {
						oCurrControl.setSelectedKey(oData.results[0].Currency);
					}
				},
				error: function (oError) {
					oCurrControl.setBusy(false);
				}
			});
		},

		_fetchIntentionData: function () {
			let oServiceCallModel = this.getModel();
			let sServiceURL = "/xEY1xSAV_C_ReadIntentVH";
			let that = this;
			this.getBusyDialog().open();
			oServiceCallModel.read(sServiceURL, {
				method: "GET",
				sorters: [
					new sap.ui.model.Sorter("SerialNumber")
				],
				success: function (oData, oResponse) {
					that.getBusyDialog().close();
					let oModel = new JSONModel(oData);
					that.getView().setModel(oModel, "intentionVHModel");
					that._managePeriodFieldsEditability(false);
				},
				error: function (oError) {
					that.getBusyDialog().close();
					MessageBox.error(that.getI18nText("errorFetchingIntentions"));
				}
			});
		},
		_managePeriodFieldsEditability: function (bIsChangeEventCalled) {
			let oView = this.getView(),
				oIntentionCtrl = oView.byId("idIntentionComboBox");

			if (!bIsChangeEventCalled) {
				oIntentionCtrl.setSelectedKey(oIntentionCtrl.getSelectedKey());
			}

			let oSelectedItem = oIntentionCtrl.getSelectedItem(),
				oSelectedData = oSelectedItem.getBindingContext("intentionVHModel").getObject(),
				oPeriodTo = oView.byId("idPeriodToInput"),
				iSpecialPeriodVal = formatter.convertStringToInt(oSelectedData.SpecialPeriod);

			if (iSpecialPeriodVal !== formatter.convertStringToInt(0)) {
				oPeriodTo.setEditable(false);
				oPeriodTo.setValue(formatter.convertStringToInt(oSelectedData.PeriodTo));
			} else {
				// IF 'PERIODIC' selected, then set Editable
				oPeriodTo.setEditable(true);
				// oPeriodTo.setValue(0);
			}

		},

		_createJournalEntriesFilterData: function (oEvent) {
			let oBindingContext = oEvent.getSource().getBindingContext();
			// If SUM row is clicked, then Do Not Execute code further
			if (!oBindingContext.getProperty("GLAccount")) {
				return;
			}

			let oReconLedgerData = this.getModel("viewConfigDataModel").getData(),

				oFiscalYear = this.getView().byId("idFiscalYearFilter"),
				sFiscalYearVal = oFiscalYear.getDateValue().getFullYear(),
				oPeriodFrom = parseInt(this.getView().byId("idPeriodFromInput").getValue(), [10]),
				oPeriodTo = parseInt(this.getView().byId("idPeriodToInput").getValue(), [10]),
				oCnsldtnUnit = this.getView().byId("idConsUnit"),
				oLocalOrGroupCurrency = this.getView().byId("idCurrency"),
				oSelectedIntention = this.getView().byId("idIntentionComboBox").getSelectedItem().getBindingContext("intentionVHModel").getObject(),
				sIntentValue = formatter.convertStringToInt(oSelectedIntention.PeriodTo) === 0 ? '' : formatter.convertStringToInt(
					oSelectedIntention.SpecialPeriod),

				sGLAccount = oBindingContext.getProperty("GLAccount").padStart(10, "0"),

				// Gives an ERROR in code but Runs perfectly in Run Time | Alternative code commented below
				// oAdjustmentReasonObjectMap = oReconLedgerData.adjustmentReason.reduce((previousObj, newObj) => ({...previousObj,
				// 	[newObj.AdjustmentReason]: newObj
				// }), new Object()),
				aMappedTransType = [],
				bIsOpeningBalanceEntry = false;

			let aMappedLedgerValues = [],
				//Defaulting to Reporting GAAP
				sReportingType = this.getView().byId("idTRFMainRepSegmentedBtn").getSelectedKey();
			if (sReportingType === "RGAAP") {
				aMappedLedgerValues = [oReconLedgerData.reconData.g2s, oReconLedgerData.reconData.s2t];
			} else {
				aMappedLedgerValues = [oReconLedgerData.reconData.s2t];
			}
			let aControlCustomData = oEvent.getSource().getCustomData();
			for (let obj of aControlCustomData) {
				let sCustomDataValue = obj.getValue();
				let sCustomDataKey = obj.getKey();
				if (sCustomDataKey === "mappedAdjReason") {
					// aMappedTransType.push(oAdjustmentReasonObjectMap[sCustomDataValue].TransType);
					for (let i = 0; i < oReconLedgerData.adjustmentReason.length; i++) {
						if (oReconLedgerData.adjustmentReason[i].AdjustmentReason === sCustomDataValue) {
							aMappedTransType.push(oReconLedgerData.adjustmentReason[i].TransType);
							break;
						}
					}
					continue;
				}
				if (sCustomDataKey === "mappedIsOpeningBalanceEntry") {
					bIsOpeningBalanceEntry = true;
				}

			}

			// Find Column heading Text
			let oBindingParts = oEvent.getSource().getBindingInfo("text").parts,
				linkedProperty = oBindingParts[oBindingParts.map(item => item.path.indexOf("MainCurrency") !== 0).indexOf(true)].path;

			//  Find the Binded entity Set Property List
			let propertyData = this.serviceDataProperty.property;
			propertyData = propertyData[propertyData.map(item => item.name).indexOf(linkedProperty)];
			let labelData = propertyData.extensions;
			labelData = labelData[labelData.map(item => item.name).indexOf("label")];

			return {
				"ConsolidationChartOfAccounts": oReconLedgerData.globalParameters.ConsolidationChartofAccounts,
				"FiscalYear": sFiscalYearVal,
				"PeriodFrom": oPeriodFrom,
				"PeriodTo": oPeriodTo,
				"ConsolidatioUnit": oCnsldtnUnit.getSelectedKey(),
				"ConsolidationLedger": aMappedLedgerValues,
				"FinancialTransactionType": aMappedTransType,
				"Value": oBindingContext.getProperty(linkedProperty),
				"Currency": oBindingContext.getProperty("MainCurrency"),
				"GLAccount": sGLAccount,
				"ConsolidationVersion": oReconLedgerData.globalParameters.ConsolidationVersion,
				"SelectedIntention": sIntentValue,

				"ConsolidationGroup": "",
				"PeriodMode": "PER",
				"RefConsolidationDocumentType": "W",

				"selectedCurrency": oLocalOrGroupCurrency.getSelectedKey(),
				"SectionName": labelData.value,
				"GLAccountDesc": oBindingContext.getProperty("GLAccountMdmText"),
				"bIsOpeningBalanceEntry": bIsOpeningBalanceEntry
			};

		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		onBeforeRebindTable: function (oEvent) {
			let oView = this.getView(),
				globalParameterData = oView.getModel("viewConfigDataModel").getData();
			if (!globalParameterData.globalParameters || !globalParameterData.globalParameters.ConsolidationChartofAccounts || !
				globalParameterData.globalParameters.ConsolidationVersion) {
				MessageBox.error(this.getI18nText("errorMaintainGlobalParameter"));
				return;
			}

			let idConsUnit = oView.byId("idConsUnit"),
				oConsUnit = idConsUnit.getSelectedKey(),
				idCurrType = oView.byId("idCurrency"),
				sCurrencyUnit = idCurrType.getSelectedKey(),
				oFiscalYear = oView.byId("idFiscalYearFilter"),
				sFiscalYearVal = oFiscalYear.getDateValue().getFullYear(),
				oPeriodTo = oView.byId("idPeriodToInput"),
				paramToYB = parseInt(oPeriodTo.getValue(), [10]),
				oMandFilters, oUserFilters, oFilters,

				// Intention Filter Data
				oIntentionBinding = oView.byId("idIntentionComboBox").getSelectedItem().getBindingContext("intentionVHModel"),
				iSpecialPeriodVal = parseInt(oIntentionBinding.getObject().SpecialPeriod, [10]),
				intentionValue = iSpecialPeriodVal > 12 ? iSpecialPeriodVal : '',

				// If special intention is selected 'periodToForOB = special value' ELSE '12'
				iPeriodToForOB = iSpecialPeriodVal > 12 ? iSpecialPeriodVal : 12,

				sReportingType = this.getView().byId("idTRFMainRepSegmentedBtn").getSelectedKey();

			// Filters
			oMandFilters = new Filter({
				filters: [new Filter("ConsolidationUnit", FilterOperator.EQ, oConsUnit),
					new Filter("ChartOfAccounts", FilterOperator.EQ, "CANA"),
					new Filter("ConsolidationChartofAccounts", FilterOperator.EQ, globalParameterData.globalParameters.ConsolidationChartofAccounts),
					new Filter("MainCurrency", FilterOperator.EQ, sCurrencyUnit),
					new Filter("ReportingType", FilterOperator.EQ, sReportingType)
				],
				and: true
			});
			oFilters = oMandFilters;

			//	If user selected filters - generate Filters for it
			if (oEvent.getParameter("bindingParams").filters.length > 0) {
				oUserFilters = new Filter({
					filters: oEvent.getParameter("bindingParams").filters
				});
				oFilters = new Filter({
					filters: [oMandFilters, oUserFilters],
					and: true
				});
			}

			let sBindingPath = "/xEY1xSAV_C_DeferredTaxRollFrwd(p_toperiodForOB='" + iPeriodToForOB + "',p_toperiod='" + paramToYB +
				"',p_ryear='" + sFiscalYearVal + "',p_specialperiod='" + intentionValue + "')/Results";

			this.oGlobalSmartTable.setTableBindingPath(sBindingPath);
			let oBindingParams = oEvent.getParameter("bindingParams");
			oBindingParams.filters = [oFilters];
		},
		onBeforeVariantSaveFilterBar: function (oEvent) {
			let oView = this.getView(),
				oFilterBar = oView.byId("idTRFMainRepSmartFilterBar"),
				oCnsdUnit = oView.byId("idConsUnit"),
				oFiscalYear = oView.byId("idFiscalYearFilter"),
				oIntention = oView.byId("idIntentionComboBox"),
				oCurrency = oView.byId("idCurrency"),
				oPeriodTo = oView.byId("idPeriodToInput");

			oFilterBar.setFilterData({
				"_CUSTOM": {
					"ConsolidationUnit": oCnsdUnit.getSelectedKey(),
					"FiscalYear": oFiscalYear.getValue(),
					"Intention": oIntention.getSelectedKey(),
					"CurrType": oCurrency.getSelectedKey(),
					"PeriodTo": oPeriodTo.getValue(),
					"VariantID": oFilterBar.getCurrentVariantId()
				}
			});
		},
		onAfterVariantLoadFilterBar: function (oEvent) {
			var oView = this.getView();
			var oFilterBar = oView.byId("idTRFMainRepSmartFilterBar");
			var oCnsdUnit = oView.byId("idConsUnit");
			var oFiscalYear = oView.byId("idFiscalYearFilter");
			let oIntention = oView.byId("idIntentionComboBox");
			var oCurrency = oView.byId("idCurrency");
			let oPeriodTo = this.getView().byId("idPeriodToInput");
			var oFilterData = oFilterBar.getFilterData()["_CUSTOM"];

			//	Setting Data to filter fields
			oCnsdUnit.setSelectedKey(oFilterData.ConsolidationUnit);
			oFiscalYear.setValue(oFilterData.FiscalYear);
			oIntention.setSelectedKey(oFilterData.Intention);
			oCurrency.setSelectedKey(oFilterData.CurrType);
			oPeriodTo.setValue(formatter.convertStringToInt(oFilterData.PeriodTo));

			// If Consolidation Unit is loaded, then call Ledger Data
			if (oFilterData.ConsolidationUnit) {
				this.fetchReconLedgerData();
			}

			// Fetch Currency Data for Dropdown
			if (oFilterData.CurrType) {
				oCurrency.setVisible(true);
				this._fetchCurrencyData(true);
			}

			// Intention Data to be loaded.
			// If Intention is 'Empty' in Saved Variant, still we need data in DropDown list.
			this._fetchIntentionData();
		},
		onSearchButtonPressed: function (oEvent) {
			// Find the Binded entity Set Property List
			let serviceData = this.getModel().getServiceMetadata().dataServices.schema[0].entityType;
			this.serviceDataProperty = serviceData.find(tempServiceData => tempServiceData.name === "xEY1xSAV_C_DeferredTaxRollFrwdResults");

			// this.fetchReconLedgerData(oEvent);
		},
		onSearch: function (oEvent) {
			if (oEvent.getParameters().refreshButtonPressed) {
				// Search field's 'refresh' button has been pressed.
				// This is visible if you select any master list item.
				// In this case no new search is triggered, we only
				// refresh the list binding.
				this.onRefresh();
			} else {
				var aTableSearchState = [];
				var sQuery = oEvent.getParameter("query");

				if (sQuery && sQuery.length > 0) {
					aTableSearchState = [new Filter("GLAccount", FilterOperator.Contains, sQuery)];
				}
				this._applySearch(aTableSearchState);
			}
		},
		onDataReceivedSmartTable: function (oEvt) {
			this.getBusyDialog().open();
			this.oGlobalSmartTable.getTable().setVisibleRowCount(10);
			var oIntervalCall = window.setInterval(function () {
				this.onAdjustTableCol();
				window.clearInterval(oIntervalCall);
			}.bind(this), 1000);
		},

		onAdjustTableCol: function () {
			let oMainTable = this.oGlobalSmartTable;
			var oTable = oMainTable.getTable();
			var aCols = oTable.getColumns();
			for (var i = aCols.length - 1; i >= 0; i--) {
				oTable.autoResizeColumn(i);
			}

			// Function call to add Text Label in SUM Row
			// this._addTextLabelToSumRow(oTable);

			this.getBusyDialog().close();
		},
		onChangeDatePickerFilter: function (oEvent) {
			let oDP = oEvent.getSource();

			if (oEvent.getParameter("valid")) {
				oDP.setValueState("None");
			} else {
				oDP.setValueState("Error");
			}
		},
		onConsUnitChange: function (oEvent) {
			this._fetchCurrencyData(false);
			this.fetchReconLedgerData();
		},

		onChangeIntentionComboBox: function (oEvent) {
			let oView = this.getView(),
				oIntentionCtrl = oView.byId("idIntentionComboBox"),
				oSelectedItem = oIntentionCtrl.getSelectedItem();

			// Validation for Invalid data	
			if (!oSelectedItem) {
				oIntentionCtrl.setSelectedItem("");
				return;
			}
			this._managePeriodFieldsEditability(true);
		},
		fetchReconLedgerData: function () {
			let oServiceCallModel = this.getModel();
			let sServiceURL = oServiceCallModel.createKey("/xEY1xSAV_C_Recon_Ledger", {
				"bunit": this.byId("idConsUnit").getSelectedKey()
			});
			let that = this;
			oServiceCallModel.read(sServiceURL, {
				method: "GET",
				success: function (oData, oResponse) {
					var oModel = that.getModel("viewConfigDataModel");
					oModel.getData().reconData = oData;
					oModel.refresh();
				},
				error: function (oError) {
					if (parseInt(oError.statusCode, [10]) !== 404) {
						MessageToast.show(that.getI18nText("reconServiceCallError"));
					}

				}
			});
		},

		onLiveChangePeriodTo: function () {
			let oPeriodTo = this.getView().byId("idPeriodToInput");
			let p_fromyb = parseInt(this.getView().byId("idPeriodFromInput").getValue(), [10]);
			let p_toyb = parseInt(oPeriodTo.getValue(), [10]);

			oPeriodTo.setValueState("None");
			//	If PeriodTo < PeriodFrom, then do not execute further service call 
			if (p_toyb < p_fromyb) {
				oPeriodTo.setValueState("Error");
				oPeriodTo.setValueStateText(this.getI18nText("periodToLessThanPeriodFromErrorMsg"));
				return;
			} else if (p_toyb > '012') {
				oPeriodTo.setValueState("Error");
				oPeriodTo.setValueStateText(this.getI18nText("periodToGreaterThanLastPeriod"));
				return;
			}
		},
		onPressColumnMenuOpenGLAccount: function (oEvent) {
			// Get the Popup object.
			let oPopup = oEvent.getParameter("menu").getPopup();

			// Attach  'attachOpened' event to popup - triggered when popup is opened.
			oPopup.attachOpened(function (evt) {
				// Get the items of popup
				let aContentItems = evt.getSource().getContent().getAggregation("items");

				// Generate new array only with ID of item controls. Take only item which contains "menu-freeze"
				let iFreezeItemIndex = aContentItems.map(item => item.getId().toString().indexOf("menu-freeze") !== -1).indexOf(true);
				aContentItems[iFreezeItemIndex].setEnabled(false);
			});
		},
		onPressTRFEntryDetails: function (oEvent) {
			// Generate Data for Journal Entries Filter
			var oJournalEntryData = this._createJournalEntriesFilterData(oEvent);

			// If oJournalEntryData does not exist, then Do Not Execute code further
			if (!oJournalEntryData) {
				return;
			}

			var oModel = new JSONModel(oJournalEntryData);
			this.getOwnerComponent().setModel(oModel, "JournalEntryData");
			this.oRouter.navTo("JournalEntries");
		},
		onChangeButtonReportingType: function (oEvent) {
			let oFilterBar = this.getView().byId("idTRFMainRepSmartFilterBar");
			if (oFilterBar.validateMandatoryFields()) {
				oFilterBar.fireSearch();
			}
		}

	});
});