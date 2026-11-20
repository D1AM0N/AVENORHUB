import StandardLogin from "@/components/StandardLogin";

export const instant = false;

export const metadata = {
  title: "Login - AvenorHub Enterprise",
  description: "Sign in to your AvenorHub business management workspace",
};

export default function HomePage() {
  return <StandardLogin />;
}
