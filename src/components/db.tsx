import * as duckdb from "@duckdb/duckdb-wasm";
import { initializeDuckDb} from "duckdb-wasm-kit";

export async function setupDB() {
  const config: duckdb.DuckDBConfig = {
    query: {
      castBigIntToDouble: true,
    },
  }; 
  const db = await initializeDuckDb({ config, debug: true });
  const file = "fire_perimeter.parquet";
  const url = "https://gtfs-parquet.s3.us-west-2.amazonaws.com/lf_perimeter_nrt_all.parquet";

  await db.registerFileURL(
    file,
    url,
    duckdb.DuckDBDataProtocol.HTTP,
    true,
  );
    
  const conn = await db.connect();
  // console.log("installing extensions");
  await conn.query("INSTALL spatial; LOAD spatial;");
  // await conn.query("INSTALL parquet; LOAD parquet;");

    
  console.log("create view");
  await conn.query(
    `CREATE VIEW IF NOT EXISTS '${file}' AS SELECT * FROM '${file}'`,
  );

}
