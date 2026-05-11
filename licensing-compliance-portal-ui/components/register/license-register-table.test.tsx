import React from "react";
import { render, screen } from "@testing-library/react";
import { LicenseRegisterTable } from "@/components/register/license-register-table";

describe("LicenseRegisterTable", () => {
  it("renders public register rows", () => {
    render(
      <LicenseRegisterTable
        entries={[
          {
            licenseNumber: "BNR/FB/2024/001",
            institutionName: "Kigali Forex Bureau Ltd",
            licenseType: "FOREX_BUREAU",
            licensedAt: "2024-03-15",
            status: "ACTIVE",
          },
        ]}
      />,
    );

    expect(screen.getByText("Licensed institutions register")).toBeInTheDocument();
    expect(screen.getByText("Kigali Forex Bureau Ltd")).toBeInTheDocument();
    expect(screen.getByText("BNR/FB/2024/001")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("renders an error state when the backend request fails", () => {
    render(<LicenseRegisterTable entries={[]} errorMessage="The register service is offline." />);

    expect(screen.getByText("Register temporarily unavailable")).toBeInTheDocument();
    expect(screen.getByText("The register service is offline.")).toBeInTheDocument();
  });
});
