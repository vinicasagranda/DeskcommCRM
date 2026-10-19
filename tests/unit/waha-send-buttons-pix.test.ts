/**
 * Contratos do caminho Pix → sendButtons (cta_copy) no WAHA.
 * Não sobe HTTP: só garante o shape que o client monta e o fallback do adapter.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const sendButtons = vi.fn();
const sendMessage = vi.fn();
const sendMedia = vi.fn();
const sendContactVcard = vi.fn();

vi.mock("@/lib/waha/client", () => ({
  getWahaClient: () => ({
    sendButtons,
    sendMessage,
    sendMedia,
    sendContactVcard,
  }),
}));

vi.mock("@/lib/waha/resolve-contact-whatsapp-id", () => ({
  resolveCanonicalCusChatId: async (_c: unknown, _s: string, to: string) => to,
  resolveWhatsappIdForContactCard: async () => null,
  resolvePhoneJidDigitsForCall: async () => null,
}));

vi.mock("@/lib/waha/send", () => ({
  marcarConversaComoLida: vi.fn(),
  resolveWahaChatId: (to: string) => to,
}));

vi.mock("@/lib/logger", () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

import { wahaAdapter } from "@/lib/channels/adapters/waha";

describe("wahaAdapter.copyButton → sendButtons", () => {
  beforeEach(() => {
    sendButtons.mockReset();
    sendMessage.mockReset();
    sendButtons.mockResolvedValue({ key: { id: "3EB0PIX" } });
    sendMessage.mockResolvedValue({ id: "3EB0TXT" });
  });

  it("manda cta_copy com o código Pix", async () => {
    const out = await wahaAdapter.send({
      organizationId: "org",
      sessionRef: "sess",
      to: "5511999999999@c.us",
      kind: "text",
      body: "Tipo: CPF\nChave: 02784668266",
      copyButton: {
        label: "Copiar chave Pix",
        code: "02784668266",
        header: "Pix — vini",
      },
    });

    expect(sendButtons).toHaveBeenCalledWith(
      "sess",
      "5511999999999@c.us",
      expect.objectContaining({
        header: "Pix — vini",
        body: "Tipo: CPF\nChave: 02784668266",
        buttons: [{ type: "copy", text: "Copiar chave Pix", copyCode: "02784668266" }],
      }),
    );
    expect(sendMessage).not.toHaveBeenCalled();
    expect(out.externalId).toBe("3EB0PIX");
  });

  it("cai em texto se sendButtons falhar", async () => {
    sendButtons.mockRejectedValueOnce(new Error("waha_500"));

    const out = await wahaAdapter.send({
      organizationId: "org",
      sessionRef: "sess",
      to: "5511999999999@c.us",
      kind: "text",
      body: "Tipo: CPF",
      copyButton: {
        label: "Copiar chave Pix",
        code: "02784668266",
        header: "Pix — vini",
      },
    });

    expect(sendMessage).toHaveBeenCalledWith(
      "sess",
      "5511999999999@c.us",
      "Pix — vini\nTipo: CPF\n02784668266",
    );
    expect(out.externalId).toBe("3EB0TXT");
  });
});
