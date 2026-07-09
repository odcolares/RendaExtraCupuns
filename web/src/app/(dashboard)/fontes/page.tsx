import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { getFontesAction } from "@/actions/affiliates";

export default async function FontesPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }
  
  const tenantId = session.user.tenantId;
  const fontes = await getFontesAction(tenantId || "");
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Fontes do WhatsApp</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie os grupos e newsletters do WhatsApp que estão sendo monitorados
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Fontes Monitoradas</CardTitle>
          <CardDescription>
            Você tem {fontes.length} fonte{fontes.length !== 1 ? "s" : ""} cadastrada{fontes.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {fontes.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma fonte cadastrada. Adicione sua primeira fonte para começar a monitorar ofertas.
            </p>
          ) : (
            <div className="space-y-4">
              {fontes.map((fonte) => (
                <div key={fonte.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{fonte.name}</h3>
                      <p className="text-sm text-muted-foreground truncate max-w-xs">
                        {fonte.url}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${fonte.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                      {fonte.isActive ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
