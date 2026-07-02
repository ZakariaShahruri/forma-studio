import { Hero } from "@/components/Hero";
import { Statement } from "@/components/Statement";
import { Work } from "@/components/Work";
import { Approach } from "@/components/Approach";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <main>
      <Hero />
      <Statement />
      <Work />
      <Approach />
      <Footer />
    </main>
  );
}
