var CheckStyleElement = document.getElementById("checkStyleLabel");
var PMDElement = document.getElementById("PMDLabel");
var FindBugsElement = document.getElementById("FindBugsLabel");
var MaintainabilityDefectsElement = document.getElementById("maintainabilityDefectsLabel");
var FunctionDefectsElement = document.getElementById("functionalDefectsLabel");
var OtherElement = document.getElementById("otherLabel");

/**
 * Handles click on checkboxes for showing results of different tools
 */
function handleClickTreeMapTypeSat(value, checked) {
	if (checked) {
		var index = acceptedTypes.indexOf(value);
        if (index < 0) {
			acceptedTypes.push(value)
        }
    } else {
        var index = acceptedTypes.indexOf(value);
        if (index > -1) {
            acceptedTypes.splice(index, 1);
        }
    }
}
/**
* Handles all clicks on label redirect to a click on the box
*/
function onClickLabel(idToggle) {
  	$(idToggle).prop('checked', !$(idToggle).prop('checked'));
	$(idToggle).click();
}
function onClickLabelRadioButton(idToggle) {
	if(sourceCodeLevel && idToggle == "#normalButton") {
		return;
	} else {
		$(idToggle).click();
	}
}

/**
 * handles the clicks on Sat categories
 */
function handleClickCategorySat(value, checked) {
	
	var arrayClasses = [".FunctionalDefects",".MaintainabilityDefects",".StyleConventions"];
	var arrayNames = ["FunctionalDefects","MaintainabilityDefects","StyleConventions"];

	var index = arrayNames.indexOf(value);

	if(index > -1) {
		$(arrayClasses[index]).prop('checked', checked); 
		$(arrayClasses[index]).click();
		toggleAcceptedCategories([arrayClasses[index]],checked);
	} else {
		if (checked) {
			var index = acceptedCategories.indexOf(value);
		   if (index < 0) {
				acceptedCategories.push(value)
		   }
		} else {
			var index = acceptedCategories.indexOf(value);
			if (index > -1) {
				acceptedCategories.splice(index, 1);
			}
		}
	}
}

/**
 * Sets all ASAT and Category labels to white
 */
function setAllLabelsWhite() {
	CheckStyleElement.style.color = colours.white();
	PMDElement.style.color = colours.white();
	FindBugsElement.style.color = colours.white();
	MaintainabilityDefectsElement.style.color = colours.white();
	FunctionDefectsElement.style.color = colours.white();
	OtherElement.style.color = colours.white();
}

/**
 * Colors based on ASAT so the labels are given colours
 */
function setASATColoured() {
	CheckStyleElement.style.color = colours.normalBlue();
	PMDElement.style.color = colours.normalGreenGradient();
	FindBugsElement.style.color = colours.normalPurple();
	MaintainabilityDefectsElement.style.color = colours.white();
	FunctionDefectsElement.style.color = colours.white();
	OtherElement.style.color = colours.white();
}

/**
 * Colors based on Categories so the labels are given colours
 */
function setCategoriesColoured() {
	CheckStyleElement.style.color = colours.white();
	PMDElement.style.color = colours.white();
	FindBugsElement.style.color = colours.white();
	MaintainabilityDefectsElement.style.color = colours.normalBlue();
	FunctionDefectsElement.style.color = colours.normalPurple();
	OtherElement.style.color = colours.normalGreenGradient();
}

/**
 * Handles click on checkboxes for using different colorscales
 */
function handleClickColorScale(radioButton) {
	if ( radioButton.value == "normal" ){
		setAllLabelsWhite();
		backgroundObject.setColorMethod(0);
	} else if ( radioButton.value == "asat" ){
		setASATColoured();
		sourceCode.setColorMethod(0); 
		backgroundObject.setColorMethod(1);
	} else if ( radioButton.value == "category" ){
		setCategoriesColoured();
		sourceCode.setColorMethod(1); 
		backgroundObject.setColorMethod(2);
	}
}

/**
 * Handles click for relative
 */
function handleClickRelativeColours(radioButton) {
	if($(radioButton).prop('checked')) {
		backgroundObject.setColorsRelative();
	} else {
		backgroundObject.setColorsAbsolute();
	}

	if ( document.getElementById("normalButton").checked ){
		setAllLabelsWhite();
		backgroundObject.setColorMethod(0);
	} else if ( document.getElementById("asatButton").checked ){
		setASATColoured();
		backgroundObject.setColorMethod(1);
	} else if ( document.getElementById("categoryButton").checked ){
		setCategoriesColoured();
		backgroundObject.setColorMethod(2);
	}
}

/**
 * Toggles between the graph and tree map visualization
 */
function handleClickVisualiser(radioButton) {
    if (radioButton.value == "graph") {
        runGraph();
    } else if (radioButton.value == "treemap") {
        runTreeMap();
    }
}