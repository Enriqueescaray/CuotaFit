import { RecuperarForm } from "./RecuperarForm";

// /auth/callback vuelve acá con ?error=link si el link del mail no sirvió.
export default async function RecuperarPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { error } = await searchParams;
  return <RecuperarForm linkFailed={error === "link"} />;
}
