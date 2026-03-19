import { test, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MainContent } from "../main-content";

// Mock heavy dependencies
vi.mock("@/lib/contexts/file-system-context", () => ({
  FileSystemProvider: ({ children }: any) => <div>{children}</div>,
  useFileSystem: vi.fn(() => ({
    selectedFile: null,
    setSelectedFile: vi.fn(),
    getAllFiles: vi.fn(() => new Map()),
    refreshTrigger: 0,
  })),
}));

vi.mock("@/lib/contexts/chat-context", () => ({
  ChatProvider: ({ children }: any) => <div>{children}</div>,
  useChat: vi.fn(() => ({
    messages: [],
    input: "",
    handleInputChange: vi.fn(),
    handleSubmit: vi.fn(),
    status: "idle",
  })),
}));

vi.mock("@/components/chat/ChatInterface", () => ({
  ChatInterface: () => <div data-testid="chat-interface">Chat</div>,
}));

vi.mock("@/components/editor/FileTree", () => ({
  FileTree: () => <div data-testid="file-tree">FileTree</div>,
}));

vi.mock("@/components/editor/CodeEditor", () => ({
  CodeEditor: () => <div data-testid="code-editor">CodeEditor</div>,
}));

vi.mock("@/components/preview/PreviewFrame", () => ({
  PreviewFrame: () => <div data-testid="preview-frame">PreviewFrame</div>,
}));

vi.mock("@/components/HeaderActions", () => ({
  HeaderActions: () => <div data-testid="header-actions">HeaderActions</div>,
}));

vi.mock("@/components/ui/resizable", () => ({
  ResizablePanelGroup: ({ children }: any) => <div>{children}</div>,
  ResizablePanel: ({ children }: any) => <div>{children}</div>,
  ResizableHandle: () => <div />,
}));

afterEach(() => {
  cleanup();
});

test("shows preview view by default", () => {
  render(<MainContent />);

  expect(screen.getByTestId("preview-frame")).toBeInTheDocument();
  expect(screen.queryByTestId("code-editor")).not.toBeInTheDocument();
});

test("switches to code view when Code tab is clicked", async () => {
  const user = userEvent.setup();
  render(<MainContent />);

  const codeTab = screen.getByRole("tab", { name: "Code" });
  await user.click(codeTab);

  expect(screen.getByTestId("code-editor")).toBeInTheDocument();
});

test("switches back to preview view when Preview tab is clicked", async () => {
  const user = userEvent.setup();
  render(<MainContent />);

  const codeTab = screen.getByRole("tab", { name: "Code" });
  await user.click(codeTab);

  expect(screen.getByTestId("code-editor")).toBeInTheDocument();

  const previewTab = screen.getByRole("tab", { name: "Preview" });
  await user.click(previewTab);

  expect(screen.queryByTestId("code-editor")).not.toBeInTheDocument();
  // Preview frame is always mounted (not remounted on tab switch)
  expect(screen.getByTestId("preview-frame")).toBeInTheDocument();
});

test("PreviewFrame stays mounted when switching to code view", async () => {
  const user = userEvent.setup();
  render(<MainContent />);

  // PreviewFrame is visible in preview mode
  expect(screen.getByTestId("preview-frame")).toBeInTheDocument();

  const codeTab = screen.getByRole("tab", { name: "Code" });
  await user.click(codeTab);

  // PreviewFrame should still be in the DOM (just hidden) after fix
  expect(screen.getByTestId("preview-frame")).toBeInTheDocument();
});

test("Preview tab is active by default", () => {
  render(<MainContent />);

  const previewTab = screen.getByRole("tab", { name: "Preview" });
  expect(previewTab).toHaveAttribute("data-state", "active");

  const codeTab = screen.getByRole("tab", { name: "Code" });
  expect(codeTab).toHaveAttribute("data-state", "inactive");
});

test("Code tab becomes active after clicking it", async () => {
  const user = userEvent.setup();
  render(<MainContent />);

  const codeTab = screen.getByRole("tab", { name: "Code" });
  await user.click(codeTab);

  expect(codeTab).toHaveAttribute("data-state", "active");

  const previewTab = screen.getByRole("tab", { name: "Preview" });
  expect(previewTab).toHaveAttribute("data-state", "inactive");
});
