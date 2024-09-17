<script>
    import * as d3 from "d3v4";
    import _ from "lodash";
    import { getContext } from "svelte";
    import Map from "../lib/floormap/Map.svelte";

    const { styleable, ...props } = getContext("sdk");
    const component = getContext("component");

    export let floorProvider;
    export let zoneProvider;
    export let sensorProvider;
    export let positionsProvider;
    export let evacuationProvider;

    export let onSave;
    export let onSelect;
</script>

<div use:styleable={$component.styles}>
    <Map 
        floorProvider={floorProvider}
        zoneProvider={zoneProvider}
        sensorProvider={sensorProvider}
        positionsProvider={positionsProvider}
        evacuationProvider={evacuationProvider}
        onSave={onSave}
        onSelect={onSelect}
    />
</div>
