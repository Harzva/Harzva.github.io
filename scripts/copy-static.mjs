import { cp, mkdir, readdir, stat } from "node:fs/promises";
import { join } from "node:path";

const staticEntries = [
  ".nojekyll",
  "acl_figures",
  "caption_crops",
  "figures_clean",
  "hero-illustration.png",
  "kd_tpl_figures",
  "ldc_figures",
  "lf2cs_figures",
  "minent_figures",
  "mmkt_figures",
  "mope_figures",
  "papers",
  "portrait_assets",
  "promptvad_figures",
  "textaug_figures",
  "thought_covers",
  "vilt_clip_figures"
];

await mkdir("dist", { recursive: true });

for (const entry of staticEntries) {
  await cp(entry, join("dist", entry), { recursive: true });
}

const rootFiles = await readdir(".");
for (const file of rootFiles.filter((name) => /^project-.*\.svg$/.test(name))) {
  const info = await stat(file);
  if (info.isFile()) {
    await cp(file, join("dist", file));
  }
}
