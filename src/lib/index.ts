import { invoke } from "@tauri-apps/api/core";

export function isInTauri() {
  return '__TAURI_INTERNALS__' in window
}

export async function saveJson(content: string) {
  if (isInTauri()) {
    await invoke("write_json", { content });
  } else {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  }
}

export async function readJson(): Promise<string> {
  if (isInTauri()) {
    const content = await invoke<string>("read_json");
    return content;
  } else {
    console.log("?")
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.style.display = 'none';
      input.accept = '.json';
      input.multiple = false;

      input.addEventListener('change', (event: Event) => {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e: ProgressEvent<FileReader>) => {
            if (typeof e.target?.result === 'string') {
              resolve(e.target?.result);
            } else {
              reject(new Error("Failed to read the file"));
            }
          };
          reader.readAsText(file); // You can use readAsDataURL or readAsArrayBuffer as needed
        }

      });

      document.body.appendChild(input);
      input.click();
      document.body.removeChild(input);
    })
  }
}