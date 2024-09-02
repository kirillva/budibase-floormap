//
//   Copyright 2018 Nachiket Gadre
//
//   Licensed under the Apache License, Version 2.0 (the "License");
//   you may not use this file except in compliance with the License.
//   You may obtain a copy of the License at
//
//       http://www.apache.org/licenses/LICENSE-2.0
//
//   Unless required by applicable law or agreed to in writing, software
//   distributed under the License is distributed on an "AS IS" BASIS,
//   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//   See the License for the specific language governing permissions and
//   limitations under the License.
//

import * as d3 from "d3v4";
import "./floorplan.css";

export default function floorplan() {
    var layers = [];
    var selectedZone = null;
    var selectedSensor = null;

    var zones = [];
    var sensors = [];
    var evac_routes = [];

    var onSelectZone = () => null;
    var onSelectSensor = () => null;

    function map() {
        return this;
    }

    function selectSensor(sensor) {
        _selectSensor(sensor);
        _selectPolygon(null);
    }

    function selectPolygon(zone) {
        _selectPolygon(zone);
        _selectSensor(null);
    }

    // function drawEvacRoutes() {
    //     // debugger;
    //     evac_routes.forEach(item=>{
    //         console.log('item', item);
    //     });
    //     // d3.polygonCentroid(alteredPoints);
    // }

    function _selectSensor(sensor) {
        d3.selectAll(".sensor").classed("selected", false);

        if (sensor) {
            d3.select(`.sensor-${sensor.id}`).classed("selected", true);
        }

        selectedSensor = sensor;
        if (onSelectSensor) {
            onSelectSensor({ item: sensor });
        }
    }

    function _selectPolygon(zone) {
        d3.selectAll(".polygon").classed("selected", false);

        if (zone) {
            d3.select(`.zone-${zone.id}`).classed("selected", true);
        }

        selectedZone = zone;
        if (onSelectZone) {
            onSelectZone({ item: zone });
        }
    }

    function alterPolygon({ sender, point, dx, dy }) {
        var circles = sender.selectAll("circle");
        var polygon = sender.select("polygon");

        if (point) {
            point.attr("cx", dx).attr("cy", dy);
        }

        var points = circles.nodes();
        var alteredPoints = [];
        for (var i = 0; i < points.length; i++) {
            const circle = points[i];
            const cx = Number(circle.getAttribute("cx"));
            const cy = Number(circle.getAttribute("cy"));

            if (!point) {
                circle.setAttribute("cx", cx + dx);
                circle.setAttribute("cy", cy + dy);
                alteredPoints.push([cx + dx, cy + dy]);
            } else {
                alteredPoints.push([cx, cy]);
            }
        }

        polygon.attr("points", alteredPoints);

        return alteredPoints;
    }

    function moveSensor() {
        var sensor = d3.select(this).select("svg");

        var pointdX = d3.event.x;
        var pointdY = d3.event.y;

        var oldX = Number(sensor.attr("x"));
        var oldY = Number(sensor.attr("y"));

        var newX = oldX + pointdX;
        var newY = oldY + pointdY;

        sensor.attr("x", newX).attr("y", newY);

        return {
            x: newX,
            y: newY,
        };
    }

    //Called on mousedown if mousedown point if a polygon handle
    function drawPolygon(svgCanvas, zone, gPoly) {
        var polyPoints = zone.points;
        d3.select("g.outline").remove();

        // Create polygon
        gPoly = svgCanvas
            .append("g")
            .classed("polygon", true)
            .classed("zone-" + zone.id, true);
        // Add drag behavior
        var dragBehavior = d3
            .drag()
            .on("drag", function () {
                if (selectedZone === zone) {
                    const alteredPoints = alterPolygon({
                        sender: d3.select(this.parentNode),
                        point: d3.select(this),
                        dx: d3.event.x,
                        dy: d3.event.y,
                    });
                    zone.points = alteredPoints;
                    selectedZone = zone;
                    d3.select(".polygon-id-" + zone.id + "-text").remove();
                    var gPolyCentroid = d3.polygonCentroid(alteredPoints);
                    addLabel(
                        zone.name,
                        gPolyCentroid,
                        "polygon-id-" + zone.id + "-text",
                        gPoly
                    );
                }
            })
            .on("end", (_, i, circleNode) => {
                selectPolygon(selectedZone);
            });

        var polyEl = gPoly.append("polygon").attr("points", polyPoints);

        for (var i = 0; i < polyPoints.length; i++) {
            gPoly
                .append("circle")
                .attr("cx", polyPoints[i][0])
                .attr("cy", polyPoints[i][1])
                .attr("r", 4)
                .call(dragBehavior);
        }

        var bbox = polyEl._groups[0][0].getBBox();
        var bbox2 = gPoly._groups[0][0].getBBox();

        bbox.x = 0;
        bbox.y = 0;
        bbox.width = 50;
        bbox.height = 50;

        // Set translate variable data;
        gPoly.datum({
            x: 0,
            y: 0,
        });

        // Set translate elem attribute defaults
        gPoly.attr("transform", function (d) {
            return "translate(" + d.x + "," + d.y + ")";
        });

        // Add Transform for mouse drag
        gPoly.on("click", function (d) {
            selectPolygon(selectedZone);
        });
        gPoly.call(
            d3
                .drag()
                .on("drag", function (d) {
                    if (selectedZone === zone) {
                        d3.select(this).attr(
                            "transform",
                            "translate(" +
                                (d.x = d3.event.x) +
                                "," +
                                (d.y = d3.event.y) +
                                ")"
                        );
                    }
                })
                .on("end", function (d) {
                    if (selectedZone === zone) {
                        d3.select(this).attr(
                            "transform",
                            `translate(${(d.x = 0)},${(d.y = 0)})`
                        );

                        const alteredPoints = alterPolygon({
                            sender: d3.select(this),
                            dx: d3.event.x,
                            dy: d3.event.y,
                        });

                        zone.points = alteredPoints;
                        selectedZone = zone;
                        d3.select(".polygon-id-" + zone.id + "-text").remove();
                        var gPolyCentroid = d3.polygonCentroid(alteredPoints);
                        addLabel(
                            zone.name,
                            gPolyCentroid,
                            "polygon-id-" + zone.id + "-text",
                            gPoly
                        );
                        selectPolygon(selectedZone);
                    }
                })
        );

        gPoly.on("click", () => selectPolygon(zone));

        var gPolyCentroid = d3.polygonCentroid(polyPoints);

        addLabel(
            zone.name,
            gPolyCentroid,
            "polygon-id-" + zone.id + "-text",
            gPoly
        );
    }

    function addLabel(text, centroid, labelClassName, gPoly) {
        var svgText = gPoly.append("text");
        svgText
            .attr("x", centroid[0])
            .attr("y", centroid[1])
            .attr("font-size", 14)
            .attr("font-weight", 400)
            .attr("font-family", "sans-serif")
            .attr("text-anchor", "middle")
            .style("fill", "darkOrange")
            .classed(labelClassName, true);
        svgText.text(text);
    }

    map.addLayer = function (layer, index) {
        if (arguments.length > 1 && index >= 0) {
            layers.splice(index, 0, layer);
        } else {
            layers.push(layer);
        }

        return map;
    };

    map.imageLayers = function (svgCanvas, data) {
        var images = svgCanvas
            .selectAll("g.images")
            .data(data)
            .enter()
            .append("g")
            .attr("class", function (floor) {
                return "floor-" + floor.id;
            })
            .append("image");

        images
            .attr("xlink:href", function (floor) {
                return floor.image.url;
            })
            .attr("x", function (floor) {
                return floor.image.x;
            })
            .attr("y", function (floor) {
                return floor.image.y;
            })
            .attr("width", function (floor) {
                return floor.image.w;
            })
            .attr("height", function (floor) {
                return floor.image.h;
            });
    };

    map.drawText = function (g, data) {
        // DATA JOIN
        // Join new data with old elements, if any.
        var text = g.selectAll("text").data(data);

        // UPDATE
        // Update old elements as needed.
        text.attr("class", "update");

        // ENTER
        // Create new elements as needed.
        //
        // ENTER + UPDATE
        // After merging the entered elements with the update selection,
        // apply operations to both.
        text.enter()
            .append("text")
            .attr("class", "enter")
            .attr("x", function (d, i) {
                return i * 32;
            })
            .attr("dy", ".35em")
            .merge(text)
            .text(function (d) {
                return d;
            });

        // EXIT
        // Remove old elements as needed.
        text.exit().remove();
    };

    map.zonePolygons = function (svgCanvas, _zones, _onSelectZone) {
        zones = _zones;
        onSelectZone = _onSelectZone;

        zones.forEach(function (zone) {
            var gPoly;
            drawPolygon(svgCanvas, zone, gPoly);
        });
    };

    map.clear = function () {
        d3.selectAll("svg.map>g>*").remove();
    };

    map.drawEvacuation = function (gContainer, zoneFrom, zoneTo) {
        // const zoneFrom = zones.find((zone) => zone.id == route.to);
        // const zoneTo = zones.find((zone) => zone.id == route.from);

        if (!zoneFrom || !zoneTo) return;

        var gPolyCentroidFrom = d3.polygonCentroid(zoneFrom.points);
        var gPolyCentroidTo = d3.polygonCentroid(zoneTo.points);
        
        gContainer
            .append("line")
            .attr("x1", gPolyCentroidFrom[0])
            .attr("y1", gPolyCentroidFrom[1])
            .attr("x2", gPolyCentroidTo[0])
            .attr("y2", gPolyCentroidTo[1])
            // .attr("marker-start", "url(#arrow)")
            // .attr("marker-mid", "url(#arrow)")
            .attr("marker-end", "url(#arrow)")
            .classed("evacuation", true);
        
        
    };

    map.evacuationLayer = function (svgCanvas, items) {
        evac_routes = items;

        var gContainer = svgCanvas.append("g").classed("evacuation_wrapper", true);
        svgCanvas
            .append("defs")
            .append("marker")
            .attr("id", "arrow")
            .attr("viewBox", [0, 0, 12, 12])
            .attr("refX", 6)
            .attr("refY", 6)
            .attr("markerWidth", 12)
            .attr("markerHeight", 12)
            .attr("markerUnits", "strokeWidth")
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M2,2 L10,6 L2,10 L6,6 L2,2")
            .style("fill", "#3c7d27");

        // items
        gContainer.selectAll(".evacuation").remove();

        evac_routes.forEach((route) => {
            const zoneFrom = zones.find((zone) => zone.id == route.to);
            const zoneTo = zones.find((zone) => zone.id == route.from);
            map.drawEvacuation(gContainer, zoneFrom, zoneTo);

            // if (!zoneFrom || !zoneTo) return;

            // var gPolyCentroidFrom = d3.polygonCentroid(zoneFrom.points);
            // var gPolyCentroidTo = d3.polygonCentroid(zoneTo.points);
            
            // gContainer
            //     .append("line")
            //     .attr("x1", gPolyCentroidFrom[0])
            //     .attr("y1", gPolyCentroidFrom[1])
            //     .attr("x2", gPolyCentroidTo[0])
            //     .attr("y2", gPolyCentroidTo[1])
            //     // .attr("marker-start", "url(#arrow)")
            //     // .attr("marker-mid", "url(#arrow)")
            //     .attr("marker-end", "url(#arrow)")
            //     .classed("evacuation", true);
        });
    };

    map.drawZonePolygon = function (svgCanvas, zone) {
        var gContainer = svgCanvas.append("g").classed("outline", true);
        var isDrawing = false;
        var isDragging = false;
        var linePoint1, linePoint2;
        var polyPoints = zone.points;

        // var polyDraw =
        svgCanvas
            .on("mousedown", setPoints)
            .on("mousemove", drawline)
            .on("mouseup", decidePoly);

        //On mousedown - setting points for the polygon
        function setPoints() {
            if (isDragging) return;

            isDrawing = true;

            var plod = d3.mouse(this);
            linePoint1 = {
                x: plod[0],
                y: plod[1],
            };

            polyPoints.push(plod);

            var circlePoint = gContainer
                .append("circle")
                .attr("cx", linePoint1.x)
                .attr("cy", linePoint1.y)
                .attr("r", 4)
                .attr("start-point", polyPoints.length == 1 ? true : false)
                .classed("handle", true)
                .style("cursor", "pointer");

            // on setting points if mousedown on a handle

            if (d3.event.target.getAttribute("start-point") == "true") {
                completePolygon();
            }
        }

        //on mousemove - appending SVG line elements to the points
        function drawline() {
            if (isDrawing) {
                linePoint2 = d3.mouse(this);
                gContainer.select("line").remove();
                gContainer
                    .append("line")
                    .attr("x1", linePoint1.x)
                    .attr("y1", linePoint1.y)
                    .attr("x2", linePoint2[0] - 2) //arbitary value must be substracted due to circle cursor hover not working
                    .attr("y2", linePoint2[1] - 2); // arbitary values must be tested
            }
        }

        //On mouseup - Removing the placeholder SVG lines and adding polyline
        function decidePoly() {
            gContainer.select("line").remove();
            gContainer.select("polyline").remove();

            var polyline = gContainer
                .append("polyline")
                .attr("points", polyPoints);

            gContainer.selectAll("circle").remove();

            for (var i = 0; i < polyPoints.length; i++) {
                var circlePoint = gContainer
                    .append("circle")
                    .attr("cx", polyPoints[i][0])
                    .attr("cy", polyPoints[i][1])
                    .attr("r", 5)
                    .attr("handle", true)
                    .classed("handle", true);
            }
        }

        //Called on mousedown if mousedown point if a polygon handle
        function completePolygon() {
            d3.select("g.outline").remove();

            drawPolygon(svgCanvas, zone);

            zones.push(zone);
        }
    };

    map.addSensor = function (svgCanvas, sensor) {
        var gSensorContainer = svgCanvas
            .append("g")
            .classed("sensor-" + sensor.id, true)
            .classed("sensor", true);
        // ENTER
        // Create new elements as needed.

        if (sensor.image) {
            var image = new DOMParser().parseFromString(
                sensor.image,
                "text/html"
            ).body.childNodes[0];
            image.setAttribute("x", sensor.x);
            image.setAttribute("y", sensor.y);
            image.setAttribute("width", sensor.w);
            image.setAttribute("height", sensor.h);
            gSensorContainer.node().appendChild(image);
        }
        if (sensor.url) {
            var image = gSensorContainer
                .append("image")
                .attr("xlink:href", sensor.url)
                .attr("x", sensor.x)
                .attr("y", sensor.y)
                .attr("width", sensor.w)
                .attr("height", sensor.h);
        }

        // Set translate variable defaults;
        gSensorContainer.datum({
            x: 0,
            y: 0,
        });

        // Set translate elem attribute defaults
        gSensorContainer.attr("transform", function (d) {
            return "translate(" + d.x + "," + d.y + ")";
        });

        d3.selectAll(".sensor-" + sensor.id).on("click", function (d) {
            selectSensor(sensor);
        });
        d3.selectAll(".sensor-" + sensor.id).call(
            d3
                .drag()
                .on("drag", function (d) {
                    if (selectedSensor === sensor) {
                        d3.select(this).attr(
                            "transform",
                            "translate(" +
                                (d.x = d3.event.x) +
                                "," +
                                (d.y = d3.event.y) +
                                ")"
                        );
                    }
                })
                .on("end", function (d) {
                    if (selectedSensor === sensor) {
                        const newPos = moveSensor.bind(this)(sensor);
                        sensor.x = newPos.x;
                        sensor.y = newPos.y;
                        d3.select(this).attr(
                            "transform",
                            `translate(${(d.x = 0)},${(d.y = 0)})`
                        );

                        selectSensor(sensor);
                    }
                })
        );

        sensors.push(sensor);
    };

    map.sensorImageLayer = function (svgCanvas, _sensors, _onSelectSensor) {
        sensors = _sensors;
        onSelectSensor = _onSelectSensor;

        sensors.forEach((sensor) => {
            map.addSensor(svgCanvas, sensor);
        });
    };

    return map;
}
