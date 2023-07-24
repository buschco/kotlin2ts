"use client";

import { useState } from "react";

export default function Home() {
  const [value, setValue] = useState("");
  const [copied, setCopied] = useState(false);

  return (
    <main className="bg-black text-white flex min-h-screen flex-col items-stretch gap-2 justify-between p-4">
      <button
        onClick={async () => {
          await navigator.clipboard.writeText(toTS(value));
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
        className={[
          copied
            ? "bg-green-500 hover:bg-green-500"
            : "bg-purple-500 hover:bg-purple-500/90",
          "p-1 uppercase rounded-lg transition-all text-black font-bold",
        ].join(" ")}
      >
        {copied ? "Copied" : "Copy"}
      </button>
      <div className="flex-1 flex flex-row gap-6">
        <div className="flex-1 flex-col bg-slate-700 p-2">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="bg-transparent w-full h-full rounded-lg font-mono whitespace-pre overflow-scroll"
          ></textarea>
        </div>

        <pre className="p-2 flex-1 font-mono overflow-scroll">
          {value.trim() === "" ? "" : toTS(value)}
        </pre>
      </div>
    </main>
  );
}

const toTS = (input: string) => {
  return input
    .split("\n")
    .map((lineUntrimmed) => {
      try {
        const line = lineUntrimmed.trim();
        if (line.startsWith("data class ")) {
          return line.replace("data class ", "type ").replace("(", " = {");
        }

        if (line.startsWith(")")) {
          return "}";
        }

        if (line.startsWith("val ") === false) {
          throw new Error('line.startsWith("val ") === false');
        }

        const optional = line.includes("?");

        const [nameUncleaned] = /\w+:/g.exec(line) ?? [];
        if (nameUncleaned == null) throw new Error("nameUncleaned == null");

        const [typeUncleaned] = /: \S+/g.exec(line) ?? [];
        if (typeUncleaned == null) throw new Error("typeUncleaned == null");

        let type = typeUncleaned.replace(": ", "").replace("?", "");
        const name = nameUncleaned.replace(":", "");

        if (type.includes("<")) {
          const [genericInnerUncleaned] = /<.+>/g.exec(type) ?? [];
          const [genericUncleaned] = /\w+</g.exec(type) ?? [];
          if (genericUncleaned == null || genericInnerUncleaned == null) {
            throw new Error(
              "genericUncleaned == null || genericInnerUncleaned == null"
            );
          }
          const generic = genericUncleaned.replace("<", "");
          const genericInner = genericInnerUncleaned
            .replace("<", "")
            .replace(">", "");
          switch (generic) {
            case "Set":
            case "List": {
              type = `${genericInner}[]`;
              break;
            }
            case "Map": {
              type = `Record<string, ${genericInner}>`;
              break;
            }
            default:
              throw new Error(`generic not supported ${generic}`);
          }
        } else {
          console.log(type.toLowerCase());
          switch (type.toLowerCase().replace(",", "").trim()) {
            case "boolean": {
              type = "boolean,";
              break;
            }
            case "string": {
              type = "string,";
              break;
            }
            case "int":
            case "bigint":
            case "double":
            case "bigdecimal": {
              type = "number,";
              break;
            }
            case "offsetdatetime":
            case "localdate": {
              type = `string // ${type}`;
              break;
            }
          }
        }

        return `  ${name}${optional ? "?:" : ":"} ${type}`;
      } catch (error) {
        console.log(
          lineUntrimmed,
          error instanceof Error ? error.message : error
        );
        return `  // ${lineUntrimmed}`;
      }
    })
    .join("\n");
};
