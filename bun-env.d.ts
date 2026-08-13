declare module "*.svg" {
  /**
   * A path to the SVG file
   */
  const path: `${string}.svg`;
  export = path;
}

declare module "*.css" {
  /**
   * A record of class names to their corresponding CSS module classes
   */
  const classes: { readonly [key: string]: string };
  export = classes;
}

declare module "*.wav" {
  /**
   * A path to the wav file
   */
  const path: `${string}.wav`;
  export = path;
}

declare module "*.png" {
  /**
   * A path to the PNG file
   */
  const path: `${string}.png`;
  export = path;
}

declare module "*.webmanifest" {
  /**
   * A path to the web manifest file
   */
  const path: `${string}.webmanifest`;
  export = path;
}
