// @vitest-environment jsdom
import { it, expect, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { Modal, Meter, Notice } from "./UI";
it("弹窗支持关闭按钮和Escape", () => {
  const close = vi.fn();
  render(
    <Modal title="未来信件" onClose={close}>
      <p>这是内容</p>
    </Modal>,
  );
  expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "true");
  fireEvent.keyDown(document, { key: "Escape" });
  expect(close).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole("button", { name: "关闭弹窗" }));
  expect(close).toHaveBeenCalledTimes(2);
  cleanup();
});
it("估值说明始终可读，进度条限制显示范围", () => {
  render(
    <>
      <Notice />
      <Meter label="活力" value={120} />
    </>,
  );
  expect(screen.getByText(/游戏内模拟估值，不代表/)).toBeVisible();
  expect(document.querySelector(".track span")).toHaveStyle({ width: "100%" });
  cleanup();
});
