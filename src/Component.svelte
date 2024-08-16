<script>
    import * as d3 from "d3v4";
    import { getContext } from "svelte";
    import { onMount } from "svelte";
    import floorplan from "./floorplan";

    const { styleable, ...props } = getContext("sdk");
    const component = getContext("component");

    export let floorProvider;
    export let zoneProvider;
    export let sensorProvider;
    export let onChangeZone;
    export let onChangeSensor;

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

    const zones =
        zoneProvider?.rows?.map((item) => ({
            _id: item._id,
            id: `${item.id}`,
            name: item.name,
            points: JSON.parse(item.points),
        })) ?? [];

    const sensors =
        sensorProvider?.rows?.map((item) => ({
            _id: item._id,
            id: `${item.id}`,
            name: item.name,
            url: "https://downloader.disk.yandex.ru/preview/08ec0d6f7d5c522852815f84e4b306c0545da3579aa9b2d36749b91d39d2c842/66bcbdd5/GhJ_fdI2XUodsVy8VndYamz3Lm1fk46Qg4Hpobu0Ydc83q9eLZ_fPBthjGhI-IE3BD_QrvGet8W_lRPhSVnsMw%3D%3D?uid=0&filename=bluetooth_logo.png&disposition=inline&hash=&limit=0&content_type=image%2Fpng&owner_uid=0&tknv=v2&size=2048x2048",
            x: item.x,
            y: item.y,
            w: 32,
            h: 32,
        })) ?? [];

    // const mapFloors = {};
    // console.log("floors", floors);
    // console.log("zones", zones);
    // console.log("sensors", sensors);

    function drawFloors({ map, svg, items }) {
        map.imageLayers(svg, items);
        // debugger;
        // const floor = floors.find((item) => item.id == id);
        // mapFloors[id]
        // floors[0].width
        // floors[0].height
    }

    function drawZones({ map, svg, items }) {
        // items
        map.zonePolygons(svg, items);

        // add_listener
        // d3.select("#create").on("click", function () {
        //     var zonePolyPoints = [];
        //     var zone = {
        //         id: uuid(),
        //         name: "ZONE - " + uuid(),
        //         points: zonePolyPoints,
        //     };
        //     items.push(zone);
        //     new map.drawZonePolygon(svg, zone);
        // });
    }

    function drawSensors({ map, svg, floors, items }) {
        // Draw Sensor Image function
        // debugger;
        new map.sensorImageLayer(svg, floors[0], items[0]);
        // d3.select("#sensor").on("click", function () {
        //     var zonePolyPoints = [];
        //     var sensor = {
        //         id: uuid(),
        //         name: "Sensor - " + uuid(),
        //         url: "https://downloader.disk.yandex.ru/preview/08ec0d6f7d5c522852815f84e4b306c0545da3579aa9b2d36749b91d39d2c842/66bcbdd5/GhJ_fdI2XUodsVy8VndYamz3Lm1fk46Qg4Hpobu0Ydc83q9eLZ_fPBthjGhI-IE3BD_QrvGet8W_lRPhSVnsMw%3D%3D?uid=0&filename=bluetooth_logo.png&disposition=inline&hash=&limit=0&content_type=image%2Fpng&owner_uid=0&tknv=v2&size=2048x2048",
        //         x: 50,
        //         y: 50,
        //         w: 32,
        //         h: 32,
        //     };
        //     mapdata.floors[0].sensors.push(sensor);
        //     new map.sensorImageLayer(svg, mapdata.floors[0], sensor);
        // });
    }

    var map = floorplan(); // initialize floor plan

    onMount(async () => {
        var svg = d3.select("#main"),
            width = +svg.attr("width"),
            height = +svg.attr("height"),
            g = svg
                .append("g")
                .attr("transform", "translate(32," + height / 2 + ")");

        drawFloors({ map, svg, items: floors });
        drawZones({ map, svg, items: zones });
        drawSensors({ map, svg, floors, items: sensors });

    });

    function onSave() {
        const zonesData = [];
        zones.forEach((item) => {
            var zone = d3.select(`.zone-${item.id}`);
            var points = d3.select(zone.node()).selectAll("circle");

            var position = zone.data()?.[0];
            var pointsPosition = [];

            points._groups[0].forEach((item) => {
                pointsPosition.push([
                    parseInt(item.getAttribute("cx")) + position.x,
                    parseInt(item.getAttribute("cy")) + position.y,
                ]);
            });

            const obj = {
                _id: item._id,
                id: item.id,
                name: item.name,
                points: pointsPosition,
            };
            zonesData.push(obj);
        });

        if (onChangeZone) {
            // console.log(onChange, zonesData);
            zonesData.forEach((item) => {
                onChangeZone({
                    item: item,
                });
            });
        }

        if (onChangeSensor) {
            // zonesData.forEach((item) => {
            //     onChangeSensor({
            //         item: item,
            //         // floors: [],
            //         // sensors: [],
            //     });
            // });
        }
        
    }
</script>

<div use:styleable={$component.styles}>
    <button id="create">Create Zone</button>
    <button id="sensor">Place sensor</button>
    <button on:click={() => onSave()}>Save zones</button>
    <svg id="main" width="960" height="500"></svg>
</div>
