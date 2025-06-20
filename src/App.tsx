import {useEffect, useMemo} from "react";
import { Binary, makeData, makeVector, Table } from "apache-arrow";
import { io } from "@geoarrow/geoarrow-js";
import { useDuckDbQuery} from "duckdb-wasm-kit";

import Map from "./components/map";
import {setupDB} from "./components/db";

function App() {

  useEffect(() => {
    console.log("setting up db");
    setupDB()
      .catch((e) => console.error(e.message));
  },[]);

  const { arrow: data, loading } = useDuckDbQuery(`
  SELECT st_aswkb(geometry), farea
  FROM (
      SELECT geometry, farea
      FROM 'fire_perimeter.parquet'
      QUALIFY ROW_NUMBER() OVER (PARTITION BY fireid ORDER BY t DESC) = 1
  );
  `);

  // const { arrow: data, loading } = useDuckDbQuery(`
  //   SELECT st_aswkb(geometry) as geometry, farea
  //   FROM fire_perimeter.parquet limit 200;
  // `);

  const table = useMemo(() => {
    if (!data) return;
    
    const geometry_wkb: Uint8Array[] = data.getChildAt(0)?.toArray();
    const flattenedWKB = new Uint8Array(geometry_wkb.flatMap((arr) => [...arr]));
    const valueOffsets = new Int32Array(geometry_wkb.length + 1);

    for (let i = 0, len = geometry_wkb.length; i < len; i++) {
      const current = valueOffsets[i];
      valueOffsets[i + 1] = current + geometry_wkb[i].length;
    }

    const coordData = makeData({
      type: new Binary(),
      data: flattenedWKB,
      valueOffsets,
    });
    const polygonData = io.parseWkb(coordData, io.WKBType.Polygon, 2);

    const dataTable = new Table({
      geometry: makeVector(polygonData as any),
      farea: makeVector(data.getChild("farea")?.toArray()),
    });

    console.log(dataTable)

    dataTable.schema.fields[0].metadata.set(
      "ARROW:extension:name",
      "geoarrow.polygon"
    );

    return { table: dataTable };
  }, [data])
  

  return (
    <>
      {loading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255,255,255,0.7)',
          zIndex: 1000
        }}>
          <div>Loading...</div>
        </div>
      )}
      <Map
        data={table?.table}
      />
    </>
  );

}

export default App
