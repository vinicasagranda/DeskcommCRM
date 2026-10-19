/**
 * Pix não usa mais sendButtons: o WAHA aceita (ack delivered) e o celular
 * recebe bolha vazia. O caminho copyButton vira sendText com a chave no corpo.
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

describe("wahaAdapter.copyButton → sendText (sendButtons desligado)", () => {
  beforeEach(() => {
    sendButtons.mockReset();
    sendMessage.mockReset();
    sendMessage.mockResolvedValue({ id: "3EB0TXT" });
  });

  it("nunca chama sendButtons; manda texto com a chave", async () => {
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

    expect(sendButtons).not.toHaveBeenCalled();
    expect(sendMessage).toHaveBeenCalledWith(
      "sess",
      "5511999999999@c.us",
      "Pix — vini\nTipo: CPF\nChave: 02784668266\n02784668266",
      null,
    );
    expect(out.externalId).toBe("3EB0TXT");
  });
});
