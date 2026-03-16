import React from "react";
import userEvent from "@testing-library/user-event";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test-utils";
import { SimulationQuiz } from "../SimulationQuiz";
import { CITY_EXAM_SIMULATIONS } from "../simulationData";

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => <img alt={alt} {...props} />,
}));

describe("SimulationQuiz", () => {
  it("keeps the simulation catalog focused on Georgia city-exam scenarios", () => {
    expect(CITY_EXAM_SIMULATIONS).toHaveLength(16);

    const simulationText = CITY_EXAM_SIMULATIONS.map((simulation) => `${simulation.title} ${simulation.summary}`).join(" ");

    expect(simulationText).not.toContain("პარკ");
    expect(simulationText).not.toContain("აღმართ");
  });

  it("includes the official technical-questions drill before the drive scenarios", () => {
    renderWithProviders(<SimulationQuiz />);

    expect(screen.getByText("გამომცდელის კითხვა მანქანამდე")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /საგამოცდო რეჟიმი: 2 კითხვა/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /სრული ბანკი: 20 კითხვა/i })).toBeInTheDocument();
    expect(screen.queryByText("Mastery Dashboard")).not.toBeInTheDocument();
  });

  it("switches between scenarios and shows the selected simulation content", async () => {
    const user = userEvent.setup();

    renderWithProviders(<SimulationQuiz />);

    await user.click(screen.getByRole("button", { name: /შუქნიშანთან სწორი გადაწყვეტილება/i }));

    expect(screen.getByText("მწვანე, მაგრამ გასასვლელი ჩახერგილია")).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /ველოდები, სანამ გზაჯვარედინი ნამდვილად გათავისუფლდება/i,
      })
    ).toBeInTheDocument();
  });

  it("switches from technical questions to the first road scenario when mock mode is selected", async () => {
    const user = userEvent.setup();

    renderWithProviders(<SimulationQuiz />);

    await user.click(screen.getByRole("button", { name: /mock გამოცდა/i }));

    expect(screen.getByText(/ახლა ჩართულია mock შეფასება/i)).toBeInTheDocument();
    expect(screen.getByText("საგამოცდო მანქანის მომზადება")).toBeInTheDocument();
  });
});
