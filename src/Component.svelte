<script>
    import * as d3 from "d3v4";
    import _ from "lodash";
    import { getContext } from "svelte";
    import { onMount } from "svelte";
    import {
        addLayer,
        drawEvacRoutes,
        drawImages,
        drawPolygons,
        getPosition,
        uuid,
    } from "./Helpers";
    import floorplan from "./floorplan";
    import BluetoothIcon from "../lib/bluetooth.svg";

    const { styleable, ...props } = getContext("sdk");
    const component = getContext("component");

    export let floorProvider;
    export let zoneProvider;
    export let sensorProvider;
    export let positionsProvider;
    export let evacuationProvider;

    // export let onChangeZone;
    export let onSelectZone;

    // export let onChangeSensor;
    export let onSelectSensor;

    let svg;
    let g;

    $: current_floor = 1;
    $: width = 0;
    $: height = 0;
    $: polygonsVisible = true;
    $: sensorsVisible = true;
    $: evacuationVisible = true;
    $: evacuationDrawing = false;
    $: evacuationFrom = null;

    $: floorLayer = null;
    $: sensorLayer = null;
    $: zonesLayer = null;
    $: evacLayer = null;

    function _onSelectZone(item) {
        if (evacuationDrawing) {
            if (evacuationFrom) {
                map.drawEvacuation(
                    d3.select(".evacuation_wrapper"),
                    evacuationFrom.item,
                    item.item,
                );
                evacuationFrom = null;
                evacuationDrawing = false;
            } else {
                evacuationFrom = item;
            }
        }
        if (onSelectZone) {
            onSelectZone(item);
        }
    }

    function _onSelectSensor(item) {
        if (onSelectSensor) {
            onSelectSensor(item);
        }
    }

    $: floors =
        floorProvider?.rows?.map((item) => ({
            _id: item._id,
            id: item.id,
            name: item.id,
            image: {
                url: item.image.url,
                x: 0,
                y: 0,
                w: item.width,
                h: item.height,
            },
        })) ?? [];

    $: evac_routes = 
        evacuationProvider?.rows?.map((item) => ({
            id: item.id,
            from: item.from,
            to: item.to,
        })) ?? [];

    $: zones =
        zoneProvider?.rows?.map((item) => ({
            _id: item._id,
            id: `${item.id}`,
            floor: item.floor,
            name: item.name,
            points: JSON.parse(item.points),
            color: item.color,
        })) ?? [];

    $: sensors =
        sensorProvider?.rows?.map((item) => ({
            _id: item._id,
            id: `${item.id}`,
            floor: item.floor,
            name: item.name,
            image: BluetoothIcon,
            x: item.x,
            y: item.y,
            w: 32,
            h: 32,
        })) ?? [];

    $: ble_signals = [];
    // positionsProvider?.rows?.map((item) => ({
    //     id: item.id,
    //     sensor_id: item.sensor_id,
    //     distance: item.distance,
    // })) ?? [];

    $: {
        const sensors_obj = {};
        sensors.forEach((item) => {
            sensors_obj[item.id] = item;
        });

        ble_signals = ble_signals.map((item) => {
            const sensor = sensors_obj[item.sensor_id];
            return {
                id: item.sensor_id,
                x: sensor.x,
                y: sensor.y,
                z: sensor.floor * 500,
                distance: item.distance,
            };
        });
    }

    function togglePolygons(visible) {
        polygonsVisible = visible;
        if (visible) {
            d3.selectAll(".polygon").style("display", "unset");
        } else {
            d3.selectAll(".polygon").style("display", "none");
        }
    }

    function toggleEvacuation(visible) {
        evacuationVisible = visible;
        if (visible) {
            d3.selectAll(".evacuation").style("display", "unset");
        } else {
            d3.selectAll(".evacuation").style("display", "none");
        }
    }

    function toggleSensors(visible) {
        sensorsVisible = visible;
        if (visible) {
            d3.selectAll(".sensor").style("display", "unset");
        } else {
            d3.selectAll(".sensor").style("display", "none");
        }
    }

    function onCreateSensor() {
        var sensor = {
            id: uuid(),
            name: uuid(),
            image: BluetoothIcon,
            floor: current_floor,
            x: 50,
            y: 50,
            w: 32,
            h: 32,
        };
        sensors.push(sensor);
        map.addSensor(g, sensor);
    }

    function onCreateZone() {
        var zonePolyPoints = [];
        var zone = {
            id: uuid(),
            name: uuid(),
            points: zonePolyPoints,
        };
        zones.push(zone);
        map.drawZonePolygon(g, zone);
    }

    function onCreateEvacuation() {
        evacuationFrom = null;
        evacuationDrawing = true;

        // var zonePolyPoints = [];
        // var zone = {
        //     id: uuid(),
        //     name: uuid(),
        //     points: zonePolyPoints,
        // };
        // zones.push(zone);
        // map.drawZonePolygon(g, zone);
    }

    // function drawSensors({ map, g, floors, items }) {
    //     new map.sensorImageLayer(g, floors[0], items);
    //     // items.forEach((item) => {
    //     // });
    // }

    function zoomed() {
        g.attr("transform", d3.event.transform);
    }

    var map = floorplan();

    // function update(zones, floors, sensors, floor_id) {
    //     if (!svg || svg.empty()) return;

    //     if (!g) {
    //         g = svg.append("g");
    //     }

    //     map.clear();

    //     var floor = floors.filter((item) => item.id == floor_id);
    //     const { w, h } = floor[0]?.image || {};
    //     width = w;
    //     height = h;

    //     // console.log('floor', floor);

    //     map.imageLayers(g, floor);
    //     map.zonePolygons(
    //         g,
    //         zones.filter((item) => item.floor == floor_id),
    //         (item) =>
    //             _onSelectZone({
    //                 ...item,
    //                 floor: current_floor,
    //             }),
    //     );
    //     map.sensorImageLayer(
    //         g,
    //         sensors.filter((item) => item.floor == floor_id),
    //         (item) =>
    //             _onSelectSensor({
    //                 ...item,
    //                 floor: current_floor,
    //             }),
    //     );

    //     map.evacuationLayer(g, evac_routes);

    //     var zoom = d3
    //         .zoom()
    //         .scaleExtent([1, Infinity])
    //         .translateExtent([
    //             [0, 0],
    //             [width, height],
    //         ])
    //         .extent([
    //             [0, 0],
    //             [width, height],
    //         ])
    //         .on("zoom", zoomed);

    //     svg.call(zoom);

    //     // debugger;

    //     // console.log("ble_signals", ble_signals);

    //     // const pos = getPosition(ble_signals);
    //     // var start = Date.now();
    //     // var positions = [];
    //     // for (var j = 0; j < 10000; j++) {
    //     //     positions.push({
    //     //         x: Math.random() * 1000,
    //     //         y: Math.random() * 1000,
    //     //         z: Math.random() * 1000,
    //     //         distance: Math.random() * 500,
    //     //     })
    //     // }
    //     // const pos = getPosition(positions);
    //     // console.log(Date.now() - start, pos);

    //     // console.log("pos", pos);
    //     // const pos = getPosition([
    //     //     {
    //     //         x: 0,
    //     //         y: 0,
    //     //         z: 0,
    //     //         distance: 0.866,
    //     //     },
    //     //     {
    //     //         x: 1,
    //     //         y: 1,
    //     //         z: 1,
    //     //         distance: 0.866,
    //     //     },
    //     //     {
    //     //         x: 0,
    //     //         y: 1,
    //     //         z: 0,
    //     //         distance: 0.866,
    //     //     },
    //     //     {
    //     //         x: 1,
    //     //         y: 0,
    //     //         z: 1,
    //     //         distance: 0.866,
    //     //     },
    //     // ]);
    // }

    $: {
        if (floorLayer) {
            // console.log('floors', floors)
            const floorItems = drawImages(floorLayer, {
                name: "floor-1",
                items: floors.map((item) => ({
                    id: item.id,
                    url: item.image.url,
                    x: item.image.x,
                    y: item.image.y,
                    w: item.image.w,
                    h: item.image.h,
                })),
            });
            floorItems.on("click", function () {
                console.log("click");
            });
            floorItems.on("drag", function () {
                console.log("drag");
            });
            const { w, h } = floors[0]?.image || {};
            width = w;
            height = h;
        }

        if (sensorLayer) {
            console.log("sensors", sensors);
            const sensorItems = drawImages(sensorLayer, {
                name: "sensors-1",
                items: sensors.map((item) => ({
                    id: item.id,
                    image: item.image,
                    x: item.x,
                    y: item.y,
                    w: item.w,
                    h: item.h,
                })),
            });
            sensorItems.on("click", function () {
                console.log("click2");
            });
            sensorItems.on("drag", function () {
                console.log("drag2");
            });
        }

        if (zonesLayer) {
            const { polygons: zonesItems, points: zonePointItems } =
                drawPolygons(zonesLayer, {
                    name: "zones-1",
                    items: zones.map((item) => ({
                        id: item.id,
                        points: item.points,
                    })),
                });
            zonesItems?.on("click", function () {
                console.log("zonesItems");
            });
            zonePointItems?.on("click", function () {
                console.log("zonePointItems");
            });
        }

        if (evacLayer) {
            // const items = _.groupBy(zones, item=>item.id);
            const zonesObj = {};
            zones.forEach(item=>{
                zonesObj[item.id] = item;
            });

            // console.log(items);
            

            drawEvacRoutes(evacLayer, { name: "evacuation-1", items: 
                evac_routes.map((route) => {
                    const from = zonesObj[route.from];
                    const to = zonesObj[route.to];
                    // console.log('zonesObj', zonesObj);

                    // const zoneFrom = zones.find((zone) => zone.id == route.to);
                    // const zoneTo = zones.find((zone) => zone.id == route.from);
                    return {
                        id: route.id,
                        from: from,
                        to: to
                    }
                })
            });
        }

        
        const zoom = d3.zoom().scaleExtent([1, Infinity])
            .translateExtent([
                [0, 0],
                [width, height],
            ])
            .extent([
                [0, 0],
                [width, height],
            ])
            .on("zoom", zoomed);

        if (svg) {
            svg.call(zoom);
        }
    }

    onMount(async () => {
        svg = d3.select("#main");
        width = +svg.attr("width");
        height = +svg.attr("height");

        g = svg.append("g");

        if (!floorLayer) {
            floorLayer = addLayer(g, { name: "floors", className: "floors" });
        }

        if (!sensorLayer) {
            sensorLayer = addLayer(g, {
                name: "sensors",
                className: "sensors",
            });
        }

        if (!zonesLayer) {
            zonesLayer = addLayer(g, { name: "zones", className: "zones" });
        }

        if (!evacLayer) {
            evacLayer = addLayer(g, { name: "evacuation", className: "evacuation" });
        }
        // var zoom = d3
        //         .zoom()
        //         .scaleExtent([1, Infinity])
        //         .translateExtent([
        //             [0, 0],
        //             [width, height],
        //         ])
        //         .extent([
        //             [0, 0],
        //             [width, height],
        //         ])
        //         .on("zoom", function () {
        //             g.attr("transform", d3.event.transform);
        //         });

        //     if (svg) {
        //         svg.call(zoom);
        //     }
    });

    // function onSave() {
    //     // zones
    //     const zonesData = [];
    //     zones.forEach((item) => {
    //         var zone = d3.select(`.zone-${item.id}`);
    //         var points = d3.select(zone.node()).selectAll("circle");

    //         var position = zone.data()?.[0];
    //         var pointsPosition = [];

    //         points._groups[0].forEach((item) => {
    //             pointsPosition.push([
    //                 parseInt(item.getAttribute("cx")) + position.x,
    //                 parseInt(item.getAttribute("cy")) + position.y,
    //             ]);
    //         });

    //         const obj = {
    //             _id: item._id,
    //             id: item.id,
    //             name: item.name,
    //             points: pointsPosition,
    //         };
    //         zonesData.push(obj);
    //     });
    //     if (onChangeZone) {
    //         zonesData.forEach((item) => {
    //             onChangeZone({
    //                 item: item,
    //             });
    //         });
    //     }

    //     // sensors
    //     const sensorsData = [];
    //     sensors.forEach((item) => {
    //         var sensor = d3.select(`.sensor-${item.id}`);

    //         var position = sensor.data()?.[0];

    //         const obj = {
    //             _id: item._id,
    //             id: item.id,
    //             name: item.name,
    //             x: item.x + position.x,
    //             y: item.y + position.y,
    //         };
    //         sensorsData.push(obj);
    //     });
    //     if (onChangeSensor) {
    //         sensorsData.forEach((item) => {
    //             onChangeSensor({
    //                 item: item,
    //             });
    //         });
    //     }
    // }
</script>

<div use:styleable={$component.styles}>
    <div class="buttons">
        <button
            class={`spectrum-Button spectrum-Button--sizeM spectrum-Button--cta gap-M svelte-4lnozm`}
            on:click={onCreateZone}>Create Zone</button
        >
        <button
            class={`spectrum-Button spectrum-Button--sizeM spectrum-Button--cta gap-M svelte-4lnozm`}
            on:click={onCreateSensor}>Place sensor</button
        >
        <button
            class={`spectrum-Button spectrum-Button--sizeM spectrum-Button--cta gap-M svelte-4lnozm`}
            on:click={onCreateEvacuation}>Create evacuation</button
        >
        {#each floors as floor}
            <button
                class={`spectrum-Button spectrum-Button--sizeM spectrum-Button--cta gap-M svelte-4lnozm`}
                on:click={() => {
                    current_floor = floor.id;
                    _onSelectZone(null);
                    _onSelectSensor(null);
                }}
            >
                {floor.id}
            </button>
        {/each}
    </div>
    <svg class="map" id="main" {width} {height}></svg>

    <div class="controllers">
        <button
            class={`spectrum-Button spectrum-Button--sizeM spectrum-Button--cta gap-M svelte-4lnozm`}
            on:click={() => togglePolygons(!polygonsVisible)}>Zones</button
        >
        <button
            class={`spectrum-Button spectrum-Button--sizeM spectrum-Button--cta gap-M svelte-4lnozm`}
            on:click={() => toggleSensors(!sensorsVisible)}>Sensors</button
        >
        <button
            class={`spectrum-Button spectrum-Button--sizeM spectrum-Button--cta gap-M svelte-4lnozm`}
            on:click={() => toggleEvacuation(!evacuationVisible)}
            >Evacuation</button
        >
    </div>
</div>

<style>
    .buttons {
        display: flex;
        position: absolute;
        gap: 4px;
    }
    .controllers {
        display: flex;
        position: absolute;
        gap: 4px;
    }
    .map {
        margin: 32px 32px 0;
    }
</style>
