<script>
    import * as d3 from "d3v4";
    import { getContext } from "svelte";
    import { onMount } from "svelte";
    import { getPosition, uuid } from "./Helpers";
    import floorplan from "./floorplan";
    import BluetoothIcon from "../lib/bluetooth.svg";

    const { styleable, ...props } = getContext("sdk");
    const component = getContext("component");

    export let floorProvider;
    export let zoneProvider;
    export let sensorProvider;

    // export let onChangeZone;
    export let onSelectZone;

    // export let onChangeSensor;
    export let onSelectSensor;

    let svg;
    let g;

    $: current_floor = 1;
    $: width = 0
    $: height = 0
    $: polygonsVisible = true
    $: sensorsVisible = true

    const floors =
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

    $: zones =
        zoneProvider?.rows?.map((item) => ({
            _id: item._id,
            id: `${item.id}`,
            floor: item.floor,
            name: item.name,
            points: JSON.parse(item.points),
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

    function togglePolygons(visible){
        polygonsVisible = visible;
        if (visible) {
            d3.selectAll('.polygon').style('display', 'unset')
        } else {
            d3.selectAll('.polygon').style('display', 'none')
        }
    }

    function toggleSensors(visible){
        sensorsVisible = visible;
        if (visible) {
            d3.selectAll('.sensor').style('display', 'unset')
        } else {
            d3.selectAll('.sensor').style('display', 'none')
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

    // function drawSensors({ map, g, floors, items }) {
    //     new map.sensorImageLayer(g, floors[0], items);
    //     // items.forEach((item) => {
    //     // });
    // }

    function zoomed() {
        g.attr("transform", d3.event.transform);
    }

    var map = floorplan();

    function update(zones, floors, sensors, floor_id) {
        if (!svg || svg.empty()) return;

        if (!g) {
            g = svg.append("g");
        }

        map.clear();

        var floor = floors.filter(item=>item.id == floor_id);
        const {w, h} = floor[0]?.image || {};
        width = w;
        height = h;

        // console.log('floor', floor);

        map.imageLayers(g, floor);
        map.zonePolygons(
            g, 
            zones.filter(item=>item.floor == floor_id), 
            (item)=>onSelectZone({
                ...item,
                floor: current_floor
            })
        );
        map.sensorImageLayer(
            g, 
            sensors.filter(item=>item.floor == floor_id), 
            (item)=>onSelectSensor({
                ...item,
                floor: current_floor
            })
        );

        var zoom = d3
            .zoom()
            .scaleExtent([1, Infinity])
            .translateExtent([
                [0, 0],
                [width, height],
            ])
            .extent([
                [0, 0],
                [width, height],
            ])
            .on("zoom", zoomed);

        svg.call(zoom);
    }

    $: {
        update(zones, floors, sensors, current_floor);
    }

    onMount(async () => {
        svg = d3.select("#main");
        width = +svg.attr("width");
        height = +svg.attr("height");

        const pos = getPosition([
            // {
            //     x: 0,
            //     y: 0,
            //     z: 0,
            //     distance: 0.5,
            // },
            {
                x: 0,
                y: 0,
                z: 0,
                distance: 0.866,
            },
            {
                x: 1,
                y: 1,
                z: 1,
                distance: 0.866,
            },
            {
                x: 0,
                y: 1,
                z: 0,
                distance: 0.866,
            },
            {
                x: 1,
                y: 0,
                z: 1,
                distance: 0.866,
            },
        ]);

        // const pos = getPosition([
        //     {
        //         x: 0,
        //         y: 0,
        //         z: 0,
        //         distance: 70,
        //     },
        //     {
        //         x: 100,
        //         y: 100,
        //         z: 0,
        //         distance: 70,
        //     },
        //     {
        //         x: 0,
        //         y: 100,
        //         z: 0,
        //         distance: 70,
        //     },
        //     {
        //         x: 100,
        //         y: 0,
        //         z: 0,
        //         distance: 0.70,
        //     },
        // ]);
        

        // const pos = getPosition([
        //     {
        //         x: 0,
        //         y: 0,
        //         z: 0,
        //         distance: 0.30,
        //     },
        //     {
        //         x: 1,
        //         y: 1,
        //         z: 0,
        //         distance: 1.10,
        //     },
        //     {
        //         x: 0,
        //         y: 1,
        //         z: 0,
        //         distance: 0.80,
        //     },
        //     {
        //         x: 1,
        //         y: 0,
        //         z: 0,
        //         distance: 0.80,
        //     },
        // ]);


        console.log('pos', pos);
        update(zones, floors, sensors);
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
        {#each floors as floor}
            <button
                class={`spectrum-Button spectrum-Button--sizeM spectrum-Button--cta gap-M svelte-4lnozm`}
                on:click={()=>{
                    current_floor = floor.id
                    onSelectZone(null);
                    onSelectSensor(null);
                }}
            >
                {floor.id}
            </button>
        {/each}

        <!-- <button
            class={`spectrum-Button spectrum-Button--sizeM spectrum-Button--cta gap-M svelte-4lnozm`}
            on:click={onSave}>Save</button
        > -->
    </div>

    <svg class="map" id="main" width={width} height={height}></svg>

    
    <div class="controllers">
        <button
            class={`spectrum-Button spectrum-Button--sizeM spectrum-Button--cta gap-M svelte-4lnozm`}
            on:click={()=>togglePolygons(!polygonsVisible)}>Zones</button
        >
        <button
            class={`spectrum-Button spectrum-Button--sizeM spectrum-Button--cta gap-M svelte-4lnozm`}
            on:click={()=>toggleSensors(!sensorsVisible)}>Sensors</button
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
        margin: 32px;
    }
</style>