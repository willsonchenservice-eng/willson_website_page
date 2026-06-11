import { notFound } from "next/navigation";

export const metadata = {
  title: "About",
  robots: {
    index: false,
    follow: false,
  },
};

export default function About() {
  notFound();
}
