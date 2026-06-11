const fs = require("fs");
const path = require("path");

const source = fs.readFileSync(path.join(__dirname, "..", "lib", "notion.ts"), "utf8");

function expectSource(fragment, message) {
  if (!source.includes(fragment)) {
    console.error(message);
    process.exit(1);
  }
}

expectSource("resolveDataSource", "Expected Notion database IDs to be resolved to data source IDs before querying.");
expectSource("notion.databases.retrieve", "Expected Notion database retrieval for database links copied from Notion.");
expectSource("data_sources?.[0]?.id", "Expected first database data source ID to be used for query.");
expectSource("buildStatusFilter", "Expected status filter to be built from the actual Notion schema.");
expectSource("buildOrderSort", "Expected order sort to be optional based on the actual Notion schema.");
expectSource("workOrderPropertyNames", "Expected Work order aliases to be shared between schema sort and data mapping.");
expectSource('"数字列"', "Expected default Chinese numeric column name to be supported for Work ordering.");
expectSource('"作品排序"', "Expected Chinese Work ordering property alias.");
expectSource("buildDateSort", "Expected writing date sort to be optional based on the actual Notion schema.");
expectSource("const dataSource = await resolveDataSource(databaseId, force);", "Expected Notion writing database ID to be resolved before querying.");
expectSource("data_source_id: dataSource.id", "Expected Notion writing queries to use resolved data source IDs.");
expectSource('"status"', "Expected lowercase Work status property alias.");
expectSource('"状态"', "Expected Chinese PhotoWall status property alias.");
expectSource('"文件和媒体"', "Expected Chinese PhotoWall files property alias.");
expectSource('"作品链接"', "Expected Chinese Work project link property alias.");
expectSource('"Project Link"', "Expected English Work project link property alias.");
expectSource("function propUrl", "Expected Notion URL fields to support url and text property shapes.");
expectSource("function normalizeUrlValue", "Expected Work project links to ignore non-URL marker values.");
expectSource("/^(https?:\\/\\/|\\/)/i.test(url)", "Expected Work project links to allow only web or site URLs.");
expectSource("const externalLink = propUrl(externalLinkProp);", "Expected Work external links to use normalized URL extraction.");
expectSource("ensureUniqueWorkSlugs(works).sort", "Expected Notion Work results to be sorted after mapping as a fallback.");

console.log("OK: Notion database links and localized schema aliases are supported.");
