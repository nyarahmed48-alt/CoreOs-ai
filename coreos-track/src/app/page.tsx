import { redirect } from "next/navigation";

export default function HomePage() {
  // Middleware decides where a visitor actually lands (login / pending / app).
  redirect("/entries");
}
