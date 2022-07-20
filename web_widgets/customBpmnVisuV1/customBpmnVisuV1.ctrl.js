function ctrl($scope) {

    const bpmnContainerElt = window.document.getElementById('bpmn-container');
    const bpmnVisualization = new bpmnvisu.BpmnVisualization({ container: 'bpmn-container', navigation: { enabled: true } });
    const allElementTypes = Object.values(bpmnvisu.ShapeBpmnElementKind);
    const flowNodesStates = new Map();

    // Show diagram if we find one
    showDiagram();

    function showDiagram() {
        $scope.$watch('properties.diagram', () => {
            if ($scope.properties.diagram) {
                bpmnVisualization.load($scope.properties.diagram, { fit: {type: bpmnvisu.FitType.Center} });

                // Get all elements that are in the diagram
                const allElements = getAllElementsInDiagram();

                // Show labels on diagram elements
                showLabels(allElements);

                // Add popover
                addPopover(allElements);
            }
        });
    }

    this.fitCenter = function () {
        bpmnVisualization.navigation.fit({ type: bpmnvisu.FitType.Center });
    }

    this.zoomIn = function () {
        bpmnVisualization.navigation.zoom(bpmnvisu.ZoomType.In);
    }

    this.zoomOut = function () {
        bpmnVisualization.navigation.zoom(bpmnvisu.ZoomType.Out);
    }

    function getAllElementsInDiagram() {
        return bpmnVisualization.bpmnElementsRegistry.getElementsByKinds(allElementTypes);
    }

    function showLabels(elements) {
        $scope.$watch('properties.flowNodesInfo', () => {
            let states = $scope.properties.flowNodesInfo && $scope.properties.flowNodesInfo.flowNodeStatesCounters;
            if (states) {
                let flowNodes = Object.keys(states);
                let flowNodesStatesValues = Object.values(states);
                flowNodes.forEach((flowNodeName, index) => {
                    // Find current flowNode in diagram
                    const flowNodeId = translateflowNodeNameToDiagramId(flowNodeName, elements);
                    // Get values of current flowNode
                    let flowNodeStates = new FlowNodeStates(flowNodesStatesValues[index]);
                    flowNodesStates.set(flowNodeName, flowNodeStates);
                    if (flowNodeStates.failed) {
                        bpmnVisualization.bpmnElementsRegistry.addOverlays(flowNodeId, {
                            position: 'top-right',
                            label: (flowNodeStates.failed).toString(),
                            style: {
                                font: {color: 'White'},
                                fill: {color: 'Red'},
                                stroke: {color: 'Red'}
                            }
                        });
                    }
                    if (flowNodeStates.temporary) {
                        bpmnVisualization.bpmnElementsRegistry.addOverlays(flowNodeId, {
                            position: 'middle-right',
                            label: (flowNodeStates.temporary).toString(),
                            style: {
                                font: {color: 'White'},
                                fill: {color: 'Blue'},
                                stroke: {color: 'Blue'}
                            }
                        });
                    }
                    if (flowNodeStates.readyWaiting) {
                        bpmnVisualization.bpmnElementsRegistry.addOverlays(flowNodeId, {
                            position: 'bottom-right',
                            label: (flowNodeStates.readyWaiting).toString(),
                            style: {
                                font: {color: 'White'},
                                fill: {color: 'Green'},
                                stroke: {color: 'Green'}
                            }
                        });
                    }
                    if (flowNodeStates.completed) {
                        bpmnVisualization.bpmnElementsRegistry.addOverlays(flowNodeId, {
                            position: 'bottom-left',
                            label: (flowNodeStates.completed).toString(),
                            style: {
                                font: {color: 'White'},
                                fill: {color: 'Black'},
                                stroke: {color: 'Black'}
                            }
                        });
                    }
                    if (flowNodeStates.cancelledSkipped) {
                        bpmnVisualization.bpmnElementsRegistry.addOverlays(flowNodeId, {
                            position: 'top-left',
                            label: (flowNodeStates.cancelledSkipped).toString(),
                            style: {
                                font: {color: 'White'},
                                fill: {color: 'Grey'},
                                stroke: {color: 'Grey'}
                            }
                        });
                    }
                });
            }
        });
    }

    function translateflowNodeNameToDiagramId(flowNodeName, diagramElements) {
        return diagramElements.find((element) => element.bpmnSemantic.name === flowNodeName).bpmnSemantic.id;
    }

    function getPopoverContent(flowNodeStates) {
        let content = flowNodeStates.failed ? `<div class='box red'></div>&nbsp; For ${flowNodeStates.failed}&nbsp; instance(s),&nbsp; this element is in error<br>` : "";
        content += flowNodeStates.temporary ? `<div class='box blue'></div>&nbsp; For ${flowNodeStates.temporary}&nbsp; instance(s),&nbsp; this element is in temporary state<br>` : "";
        content += flowNodeStates.readyWaiting ? `<div class='box green'></div>&nbsp; For ${flowNodeStates.readyWaiting}&nbsp; instance(s),&nbsp; this element is waiting<br>` : "";
        content += flowNodeStates.completed ? `<div class='box black'></div>&nbsp; For ${flowNodeStates.completed}&nbsp; instance(s),&nbsp; this element is completed<br>` : "";
        content += flowNodeStates.cancelledSkipped ? `<div class='box grey'></div>&nbsp; For ${flowNodeStates.cancelledSkipped}&nbsp; instance(s),&nbsp; this element is cancelled or skipped<br>` : "";
        return content;
    }

    function addPopover(bpmnElements) {
        bpmnElements.forEach(bpmnElement => {
            const htmlElement = bpmnElement.htmlElement;
            const isEdge = !bpmnElement.bpmnSemantic.isShape;
            const offset = isEdge? [0, -40] : undefined; // undefined offset for tippyjs default offset

            tippy(htmlElement, {
                onShow(instance) {
                    let flowNodeStates = flowNodesStates.get(bpmnElement.bpmnSemantic.name);
                    if (flowNodeStates) {
                        instance.setContent(getPopoverContent(flowNodeStates));
                    } else {
                        // Hide the popover if no content
                        instance.popper.hidden = true;
                    }
                },
                // work perfectly on hover with or without 'diagram navigation' enable
                appendTo: bpmnContainerElt.parentElement,

                // https://atomiks.github.io/tippyjs/v6/all-props/#sticky
                // This has a performance cost since checks are run on every animation frame. Use this only when necessary!
                // only check the "reference" rect for changes
                sticky: 'reference',

                arrow: true,
                offset: offset,
                placement: 'top',
                maxWidth: 'none',
                allowHTML: true
            });
        });
    }

    class FlowNodeStates {
        constructor(flowNodeStates) {
            this.failed = (flowNodeStates.failed ? flowNodeStates.failed : 0);

            // Temporary
            this.executing = flowNodeStates.executing ? flowNodeStates.executing : 0;
            this.completing = flowNodeStates.completing ? flowNodeStates.completing : 0;
            this.initializing = flowNodeStates.initializing ? flowNodeStates.initializing : 0;
            this.temporary = this.executing + this.completing + this.initializing;

            // ReadyWaiting
            this.ready = flowNodeStates.ready ? flowNodeStates.ready : 0;
            this.waiting = flowNodeStates.waiting ? flowNodeStates.waiting : 0;
            this.readyWaiting = this.ready + this.waiting;

            this.completed = flowNodeStates.completed ? flowNodeStates.completed : 0;

            // CanceledSkipped
            this.cancelled = flowNodeStates.cancelled ? flowNodeStates.cancelled : 0;
            this.skipped = flowNodeStates.skipped ? flowNodeStates.skipped : 0;
            this.cancelledSkipped = this.cancelled + this.skipped;
        }
    }
}
