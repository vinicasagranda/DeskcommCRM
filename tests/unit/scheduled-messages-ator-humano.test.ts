/**
 * Agendamento criado por humano deve sair como actor user — senão o
 * pre_go_live (modo de teste) bloqueia e o celular não recebe.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const FONTE = readFileSync(
  join(process.cwd(), "app/api/v1/cron/scheduled-messages/route.ts"),
  "utf8",
);

describe("cron scheduled-messages — ator do envio", () => {
  it("usa actor user quando created_by_user_id existe", () => {
    expect(FONTE).toContain('type: "user"');
    expect(FONTE).toContain("created_by_user_id");
    // Não pode mais forçar webhook_source para todo mundo.
    expect(FONTE).toMatch(/created_by_user_id\s*\n?\s*\?\s*\(\{\s*type:\s*"user"/);
  });

  it("marca o agendamento como failed se a mensagem nasceu failed", () => {
    expect(FONTE).toContain('msg.status === "failed"');
    expect(FONTE).toContain('status: "failed"');
  });
});
