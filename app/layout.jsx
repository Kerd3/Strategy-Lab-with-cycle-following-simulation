import "./globals.css";

export const metadata = {
  title: "The Box Ward — The 100 Prisoners Puzzle",
  description:
    "Play the 100 Prisoners and 100 Boxes puzzle, then compare random search with the cycle-following strategy in Strategy Lab.",
  applicationName: "The Box Ward",
  keywords: [
    "100 prisoners problem",
    "logic puzzle",
    "probability game",
    "React game",
    "Next.js portfolio project",
  ],
  openGraph: {
    title: "The Box Ward — The Prisoner Puzzle",
    description:
      "One hundred prisoners. One hundred boxes. Fifty openings each. Explore the puzzle and discover the cycle-following strategy.",
    type: "website",
  },
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
