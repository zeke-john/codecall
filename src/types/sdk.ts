import * as fs from "fs";
import * as path from "path";

export class VirtualFileSystem {
  private files = new Map<string, string>();

  set(filePath: string, content: string): void {
    this.files.set(filePath, content);
  }

  async writeToDisk(outputDir: string): Promise<void> {
    for (const [filePath, content] of this.files) {
      const fullPath = path.join(outputDir, filePath);
      const dir = path.dirname(fullPath);
      await fs.promises.mkdir(dir, { recursive: true });
      await fs.promises.writeFile(fullPath, content, "utf-8");
    }
  }

  get(path: string): string | undefined {
    return this.files.get(path);
  }

  has(path: string): boolean {
    return this.files.has(path);
  }

  getAllPaths(): string[] {
    return Array.from(this.files.keys()).sort();
  }

  getTree(): string {
    const paths = this.getAllPaths();
    if (paths.length === 0) return "";

    const tree: string[] = [];
    const structure = new Map<string, string[]>();

    for (const path of paths) {
      const parts = path.split("/");
      const folder = parts.slice(0, -1).join("/");
      const file = parts[parts.length - 1];

      if (!structure.has(folder)) {
        structure.set(folder, []);
      }
      structure.get(folder)!.push(file);
    }

    const folders = Array.from(structure.keys()).sort();
    const rootFolder = folders[0]?.split("/")[0] || "tools";

    tree.push(`${rootFolder}/`);

    const subfolders = folders
      .map((f) => f.split("/").slice(1).join("/"))
      .filter(Boolean);
    const uniqueSubfolders = [...new Set(subfolders)].sort();

    for (let i = 0; i < uniqueSubfolders.length; i++) {
      const subfolder = uniqueSubfolders[i];
      const isLastFolder = i === uniqueSubfolders.length - 1;
      const folderPrefix = isLastFolder ? "└─ " : "├─ ";

      tree.push(`${folderPrefix}${subfolder}/`);

      const fullFolderPath = `${rootFolder}/${subfolder}`;
      const filesInFolder = structure.get(fullFolderPath) || [];

      for (let j = 0; j < filesInFolder.length; j++) {
        const file = filesInFolder[j];
        const isLastFile = j === filesInFolder.length - 1;
        const linePrefix = isLastFolder ? "   " : "│  ";
        const filePrefix = isLastFile ? "└─ " : "├─ ";

        tree.push(`${linePrefix}${filePrefix}${file}`);
      }
    }

    return tree.join("\n");
  }

  clear(): void {
    this.files.clear();
  }

  size(): number {
    return this.files.size;
  }
}
