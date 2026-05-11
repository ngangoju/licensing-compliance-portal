import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { FileUpload } from "@/components/workflow/file-upload";

describe("FileUpload", () => {
  it("shows a validation error for files larger than 5 MB", () => {
    const onSelect = vi.fn();

    render(<FileUpload label="Supporting documents" onSelect={onSelect} />);

    const input = screen.getByLabelText("Supporting documents");
    const file = new File([new Uint8Array((5 * 1024 * 1024) + 1)], "capital-proof.pdf", {
      type: "application/pdf",
    });

    fireEvent.change(input, {
      target: {
        files: [file],
      },
    });

    expect(screen.getByText("File exceeds the 5.0 MB upload limit.")).toBeInTheDocument();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("accepts supported files and exposes the selected name", () => {
    const onSelect = vi.fn();

    render(<FileUpload label="Supporting documents" onSelect={onSelect} />);

    const input = screen.getByLabelText("Supporting documents");
    const file = new File(["hello"], "business-plan.pdf", {
      type: "application/pdf",
    });

    fireEvent.change(input, {
      target: {
        files: [file],
      },
    });

    expect(screen.getByText("business-plan.pdf")).toBeInTheDocument();
    expect(onSelect).toHaveBeenCalledWith(file);
  });
});
