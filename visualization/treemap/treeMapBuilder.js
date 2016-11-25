var treeMapBuilder = (function() {

    // initialize all variables
    var treemap, formatNumber, rname, margin, width, height, transitioning, x, y, svg, grandparent, maxDepth, defaults, sourceCoded
    var refreshing = false;
    var upperLevel = true;
    var currentClassName = "";
	var currentNodePath = [];
	var root;

    // initialize the entire treemap up till displaying
    function initializeTheTree(root) {
        initialize(root, width, height);
        accumulateValue(root);
        accumulateWarnings(root);
        layout(root, treemap);
    }

    // initialize the root of the treemap
    function initialize(root, width, height) {
        root.x = root.y = 0;
        root.dx = width;
        root.dy = height;
        root.depth = 0;
    }

    /**
     * Will set the amount of current warnings for each specific ASAT and warning type
     */
    function updateWarningsCountInUI(d) {
        currentClassName = d.fileName;
        updateASATWarningsCount(d);
		updateDefectsCount(d);
    }

    /**
     * Aggregate the values for internal nodes. This is normally done by the
     * treemap layout, but not here because of our custom implementation.
     * We also take a snapshot of the original children (_children) to avoid
     * the children being overwritten when when layout is computed.
     */
    function accumulateValue(d) {
        return (d._children = d.values) ?
            d.value = d.values.reduce(function(p, v) {
                return p + accumulateValue(v);
            }, 0) :
            d.value;
    }
    function accumulateWarnings(d) {
        return (d._children = d.values) ?
            d.warnings = d.values.reduce(function(p, v) {
                return p + accumulateWarnings(v);
            }, 0) :
            d.warnings;
    }
    /**
     * Compute the treemap layout recursively such that each group of siblings
     * uses the same size (1×1) rather than the dimensions of the parent cell.
     * This optimizes the layout for the current zoom state. Note that a wrapper
     * object is created for the parent node for each group of siblings so that
     * the parent’s dimensions are not discarded as we recurse. Since each group
     * of sibling was laid out in 1×1, we must rescale to fit using absolute
     * coordinates. This lets us use a viewport to zoom.
     */
    function layout(d, treemap) {
        if (d._children) {
            treemap.nodes({
                _children: d._children
            });
            d._children.forEach(function(c) {
                c.x = d.x + c.x * d.dx;
                c.y = d.y + c.y * d.dy;
                c.dx *= d.dx;
                c.dy *= d.dy;
                c.parent = d;
                layout(c, treemap);
            });
        }
    }
	 // Method for counting the different warnings
    function getSatWarningsPrint(d) {
        output = "";
        output += "Lines of code: " + d.loc + " <br> ";
        for (var i = 0; i < acceptedTypes.length; i++) {
            switch (acceptedTypes[i]) {
                case "CheckStyle":
                    output += acceptedTypes[i] + ": " + formatNumber(d.warningsCheckStyle) + " <br> ";
                    break;
                case "PMD":
                    output += acceptedTypes[i] + ": " + formatNumber(d.warningsPMD) + " <br> ";
                    break;
                case "FindBugs":
                    output += acceptedTypes[i] + ": " + formatNumber(d.warningsFindBugs) + " <br> ";
                    break;
                default:
                    output += "";
            }
        }
        return output.slice(0, -3);
    }

    // Code to find a certain node in the treemap
    function findNode(path, root) {
        var node = root;
        for (var i = 0; i < path.length; i++) {
            node = node._children[path[i]]
        }
        return node;
    }
	
	// reload the content by reloading all the json and calculation the values agian.
    function reloadContent() {
        var packages = filterTypeRuleName(acceptedTypes, acceptedCategories);
        var finalJson = createJsonTreeMap(packages);
        root.values = finalJson;
        initialize(root, width, height);
        accumulateValue(root);
        accumulateWarnings(root);
        layout(root, treemap);
    }
 	// returns the number of a child node if possible, otherwise null
    function findChildNumber(d, parent) {
            for (var i = 0; i < parent._children.length; i++) {
                if (parent._children[i].fileName == d.fileName) {
                    return i;
                }
            }
            return null;
    }	
	 
    //Renders the chart with given depth and children
	function display(d) {
		var id = 0;
        setPath(d, name(d));
        var g1 = svg.insert("g", ".chart-and-code").datum(d).attr("class", "depth");
        var g = g1.selectAll("g").data(d._children).enter().append("g");

		var tooltip = d3.select("#chart-and-code").append("div").attr("class","d3-tip2").style("width", 300).style("position", "absolute").style("z-index", "10").style("visibility", "hidden");
		
        // on click square to go more in depth
        g.filter(function(d) { return d._children; })
            .classed("children", true)
            .on("click", navigationDown)
            .on("mouseover", function(d) {
				tooltip.html(d.fileName + "<br>" + getSatWarningsPrint(d));
				tooltip.style("visibility", "visible");
				console.log(d.fileName + "<br>" + getSatWarningsPrint(d));
            })
            .on("mousemove", function(d) {
				tooltip.style("top", (event.pageY - 130) + "px").style("left", (event.pageX - 280) + "px");
            })
            .on("mouseout", function(d) {
				tooltip.style("visibility", "hidden");
				console.log(d.fileName + "<br>" + getSatWarningsPrint(d));
            });

        var childrenArray = g.filter(function(d) { return d._children; })

		// bottom layer now we add a click to go to the code editor
		if ( childrenArray[0].length == 0 ){
			g.on("click", toSourceCode)
			 .on("mouseover", function(d) {
				tooltip.html(d.fileName + "<br>" + getSatWarningsPrint(d));
				tooltip.style("visibility", "visible");
            })
            .on("mousemove", function(d) {
				tooltip.style("top", (event.pageY - 130) + "px").style("left", (event.pageX - 280) + "px");
            })
            .on("mouseout", function(d) {
				tooltip.style("visibility", "hidden");
				console.log(d.fileName + "<br>" + getSatWarningsPrint(d));
            });
		}

        /**
         * This function will be triggered when the user clicks on a button.
         * It will refresh the data in the treemap according to which button is clicked.
         */
        $('.updateContent').change(function() {
            if (!refreshing) {
                refreshing = true;
                $(this).disable = true
                if ($(this).prop('name') == "sat") {
                    handleClickTreeMapTypeSat($(this).prop('value'), $(this).prop('checked'));
                } else if ($(this).prop('name') == "category") {
                    handleClickCategorySat($(this).prop('value'), $(this).prop('checked'));
                } else if($(this).prop('name') == "relative") {
                    handleClickRelativeColours($(this));
                }
                if(sourceCodeLevel) {
                    sourceCode.fullReload();
                    updateWarningsCountInUI(sourceCoded);
                } else {
                    fastReload();
                }
                var millisecondsToWait = 0;
                setTimeout(function() { refreshing = false; $(this).disable = false; }, millisecondsToWait);
            }
        })
		/**
		* find the current node and reload the tree
		* with directly navigating to this node
		*/
		function fastReload() {
            reloadContent();
            var newNode = findNode(currentNodePath, root);
            transition(newNode);
        }
        
        // Updates all warning counts for all ASATS and categories
        updateWarningsCountInUI(d);

        var children = g.selectAll(".child")
            .data(function(d) { return d._children || [d]; })
            .enter().append("g").append("rect")
            .attr("class", "child")
            .attr("x", function(d) { return x(d.x); })
            .attr("y", function(d) { return y(d.y); })
            .attr("width", function(d) { return x(d.x + d.dx) - x(d.x); })
            .attr("height", function(d) { return y(d.y + d.dy) - y(d.y); })
			.style("fill", function(d) {
				var ratios =  backgroundObject.getRatios(d);
				var weight = d.warnings / d.value;
				id +=1;
				var gradientBackground = backgroundObject.getBackground(svg, ratios,weight, id,x(d.x + d.dx),y(d.y + d.dy) );
                return "url(#gradient"+ id + ")";
            })
            .append("title");

        /**
         * Sets in the lower right corner of a node the filename
         */
        children.append("text").attr("class", "ctext")
            .text(function(d) { return d.fileName; })
            .style("fill", function() { return colours.white(); })
            .call(textBottomRight);

        if(currentNodePath.length == 1) {
            g.append("rect").attr("class", "parent").attr("class", "child")
            .attr("x", function(d) { return x(d.x); })
            .attr("y", function(d) { return y(d.y); })
            .attr("width", function(d) { return x(d.x + d.dx) - x(d.x); })
            .attr("height", function(d) { return y(d.y + d.dy) - y(d.y); });
        } else {
            g.append("rect").attr("class", "parent").attr("class", "child").call(rect);
        }

        var t = g.append("text").attr("class", "ptext").attr("dy", ".75em");

        /**
         * Sets in the upper left corner of a node the filename
         */
        t.append("tspan").style("fill", function(d) { return colours.white(); })
            .text(function(d) { return d.fileName; });

        /**
         * Sets in the upper left corner of a node the amount of warnings
         */
        t.append("tspan").attr("dy", "1.2em").text(function(d) { return d.warnings; }).style("fill", function(d) { return colours.white(); });
        t.call(text);

       
        // pushes the clicked node to the array and then shows the node
        function navigationDown(d) {
            currentNodePath.push(findChildNumber(d, d.parent));
            transition(d)
        }

        // will go to the source code view if the clicked node is a class
        function toSourceCode(d) {
            sourceCoded = d;
            sourceCodeLevel = true;
            if ( document.getElementById("asatButton").checked || document.getElementById("normalButton").checked ) {
                disableNormalButton();
            } else if ( document.getElementById("categoryButton").checked ){
                $("#categoryButton").prop('checked', true);
                $("#categoryButton").click();
                setCategoriesColoured();
            }
            updateWarningsCountInUI(d);
            sourceCode.show(d, name(d));
            setPath(d, name(d));
        	$('.CodeMirror').width(opts.width).height(opts.height - 30);
        }
        // performs a transition to a deeper level
        function transition(d) {

            if (transitioning || !d) {upperLevel = true; return;}
            upperLevel = false;
            transitioning = true;

            var g2 = display(d), t1 = g1.transition().duration(100), t2 = g2.transition().duration(100);

            // Update the domain only after entering new elements.
            x.domain([d.x, d.x + d.dx]);
            y.domain([d.y, d.y + d.dy]);

            // Enable anti-aliasing during the transition.
            svg.style("shape-rendering", null);
			svg.attr("id", "svg")

            // Fade-in entering text.
            g2.selectAll("text").style("fill-opacity", 0);

            // Transition to the new view.
            t1.selectAll(".ptext").call(text).style("fill-opacity", 0);
            t1.selectAll(".ctext").call(textBottomRight).style("fill-opacity", 0);
            t2.selectAll(".ptext").call(text).style("fill-opacity", 1);
            t2.selectAll(".ctext").call(textBottomRight).style("fill-opacity", 1);
            t1.selectAll("rect").call(rect);
            t2.selectAll("rect").call(rect);

            // Remove the old node when the transition is finished.
            t1.remove().each("end", function() { svg.style("shape-rendering", "crispEdges"); transitioning = false; });
        }

        /**
         * Goes directly to a specific level.
         * Used when the user goes back by clicking on a specific node in the path
         */
		function goToRelevantLevel(indexString, fromSourceCode) {
            sourceCodeLevel = false;
            document.getElementById('normalColourLabel2').style.textDecoration = 'none';
            document.getElementById('normalColourLabel2').style.cursor = 'pointer';
            
            if ( document.getElementById("asatButton").checked ){
                $("#asatButton").click();
            } else if ( document.getElementById("categoryButton").checked ){
                $("#categoryButton").click();
            }

			var index = parseInt(indexString.substring(indexString.length-2,indexString.length-1));
			
			while (currentNodePath.length > index) { currentNodePath.pop(); }
			var d = findNode(currentNodePath, root);
			if(fromSourceCode) { sourceCode.hide(); } else { display(d); }
			transition(d);
		}

        /**
         * Will set the path will all nodes that were needed to go to the current node.
         * All these nodes in the path are clickable and you will directly jump to them on click.
         */
		function setPath(d, path) {
			var subTitleDiv = document.getElementById("current-path");
			if(path.indexOf('/') > -1) {
				var pathFirstPart = path.substring(0, path.lastIndexOf("/") + 1);
				var pathSecondPart = path.split(/[/ ]+/).pop();
				var allPreviousLevels = path.split("/");
                var newPath = "";
                var usedIDs = [];
                for(var i = 0; i < allPreviousLevels.length - 1; i++) {
                    var id = "prevLocation" + i;
                    newPath += '<span class="path-span" id="\'' + ("prevLocation" + i) + '\'">' + allPreviousLevels[i] + '</span>/ ';
                    usedIDs.push(id);
                }
                var index = allPreviousLevels.length - 1;
                newPath += '<span id="currentLocation">' + allPreviousLevels[allPreviousLevels.length - 1] + '</span>';
                subTitleDiv.innerHTML = newPath;
				if(pathSecondPart.indexOf("java") > -1) {
					for(var i = 0; i < usedIDs.length; i++) {
						var stringID = "'" + usedIDs[i] + "'";
						document.getElementById(stringID).addEventListener("click", function() { goToRelevantLevel($(this).attr('id'), true); }, false);
					}
				} else {
                    for(var i = 0; i < usedIDs.length; i++) {
                        var stringID = "'" + usedIDs[i] + "'";
                        document.getElementById(stringID).addEventListener("click", function() { goToRelevantLevel($(this).attr('id'), false); }, false);
                    }
				}
			} else {
			   subTitleDiv.innerHTML = " <span id='currentLocation'>" + path + "</span>";
			}
		}
        return g;
    }

    function disableNormalButton() {
        $("#normalButton").prop('checked', false);
        $("#asatButton").prop('checked', true);
        $("#asatButton").click();
        document.getElementById('normalColourLabel2').style.textDecoration = 'line-through';
        document.getElementById('normalColourLabel2').style.cursor = 'default';
        setASATColoured();
    }

    /**
    * Sets all text for all elemetents in the treemap
	* for e.g. the title of the squares but also of the packages.
    */
	function text(text) {
        text.selectAll("tspan").attr("x", function(d) { return x(d.x) + 6; })
        text.attr("x", function(d) { return x(d.x) + 6; }).attr("y", function(d) { return y(d.y) + 6; })
            .style("opacity", function(d) {
                return this.getComputedTextLength() < x(d.x + d.dx) - x(d.x) ? 1 : 0;
            });
    }

    function textBottomRight(text) {
        text.attr("x", function(d) {
                return x(d.x + d.dx) - this.getComputedTextLength() - 6;
            })
            .attr("y", function(d) {
                return y(d.y + d.dy) - 6;
            })
            .style("opacity", function(d) {
                return this.getComputedTextLength() < x(d.x + d.dx) - x(d.x) ? 1 : 0;
            });
    }

    function rect(rect) {
        rect.attr("x", function(d) {
                return x(d.x);
            })
            .attr("y", function(d) {
                return y(d.y);
            })
            .attr("width", function(d) {
                return x(d.x + d.dx) - x(d.x);
            })
            .attr("height", function(d) {
                return y(d.y + d.dy) - y(d.y);
            });
    }

    /**
     * Sets the current path in a specific div and
     * gives the return button the text
     */
    function name(d) {
        var path = d.parent ? name(d.parent) + " / " + d.fileName : d.fileName;
        return path;
    }

    function setTheVariables(o, data) {
        // hard coded the depth where the click should go to source code (no zoom)
        maxDepth = 2
        defaults = {
            margin: {top: 30,right: 0,bottom: 0,left: 0},
            rootname: "TOP", format: ",d", title: "",
            width: window.innerWidth - 750,
            height: window.innerHeight - 175
        };
        // Setting up some values about number format(rounding) and marigns
        opts = $.extend(true, {}, defaults, o);
        formatNumber = d3.format(opts.format);
        rname = opts.rootname;
        margin = opts.margin;

        // size of the chart
        $('#chart-and-code').width(opts.width + 70).height(opts.height - 30);
        $('#chart').width(opts.width).height(0);
        $('#code-div').width(opts.width).height(opts.height - 30);
        width = opts.width - margin.left - margin.right;
        height = opts.height - margin.top - margin.bottom;
        x = d3.scale.linear().domain([0, width]).range([0, width]);
        y = d3.scale.linear().domain([0, height]).range([0, height]);

        // Create the d3 treemap from the library
        treemap = d3.layout.treemap().children(function(d, depth) { return depth ? null : d._children; })
            .sort(function(a, b) { return a.value - b.value; })
            .ratio(height / width * 0.5 * (1 + Math.sqrt(5))).round(false);

        // creating the chart and appending it to views
        svg = d3.select("#chart").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.bottom + margin.top - 30)
            .style("margin-left", -margin.left + "px")
            .style("margin.right", -margin.right + "px")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .style("shape-rendering", "crispEdges");

        if (data instanceof Array) { root = {fileName: rname,values: data}; } else { root = data; }
    }

    return {

        /**
         * The main method which is called to create the treeMap.
         * This calls all the methods needed like initialize.
         */
        createTreeMap: function(o, data) {
            // First we create all variables that are needed for this treemap.
            setTheVariables(o, data);

            // After cresating the variables we can start initializing and displaying the tree.
            initializeTheTree(root);
            display(root);
        },

        /**
         * Returns the local boolean 'sourceCodeLevel'
         */
        getSourceCodeLevel: function() {
            return sourceCodeLevel;
        },
        
        /**
         * Returns the local string 'currentClassName'
         */
        getCurrentClassName: function() {
            return currentClassName;
        }
    }

}());