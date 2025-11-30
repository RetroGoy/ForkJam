import sharp from "sharp";

const input = "public/logoFj.png";

const sizes = [
  { size: 192, name: "icon-192.png" },
  { size: 512, name: "icon-512.png" },
  { size: 512, name: "icon-512-maskable.png" },
  { size: 180, name: "apple-icon-180.png" },
];

for (const { size, name } of sizes) {
  sharp(input)
    .resize(size, size)
    .png()
    .toFile(`public/icons/${name}`)
    .then(() => console.log(`✔ Generated ${name}`))
    .catch(console.error);
}