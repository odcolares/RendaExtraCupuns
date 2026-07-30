import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getFontesAction } from "@/actions/affiliates";
import {
  MessageCircle,
  Activity,
  Eye,
  CheckCircle2,
  XCircle,
  Radio,
} from "lucide-react";

export default async function FontesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const tenantId = session.user.tenantId;
  const fontes = await getFontesAction(tenantId || "");
  const activeCount = fontes.filter((f) => f.isActive).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Fontes do WhatsApp
        </h1>
        <p className="text-muted-foreground mt-1">
          Grupos e newsletters que estão sendo monitorados
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-l-2 border-l-brand-pink pl-4">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm text-muted-foreground font-medium">
              Total
            </CardTitle>
            <span className="inline-flex items-center justify-center size-8 rounded-lg bg-brand-pink/10 text-brand-pink">
              <MessageCircle className="size-4" />
            </span>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{fontes.length}</span>
          </CardContent>
        </Card>
        <Card className="border-l-2 border-l-emerald-500 pl-4">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm text-muted-foreground font-medium">
              Ativas
            </CardTitle>
            <span className="inline-flex items-center justify-center size-8 rounded-lg bg-emerald-500/10 text-emerald-600">
              <Activity className="size-4" />
            </span>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-emerald-600">
              {activeCount}
            </span>
          </CardContent>
        </Card>
        <Card className="border-l-2 border-l-muted-foreground pl-4">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm text-muted-foreground font-medium">
              Inativas
            </CardTitle>
            <span className="inline-flex items-center justify-center size-8 rounded-lg bg-muted text-muted-foreground">
              <Radio className="size-4" />
            </span>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-muted-foreground">
              {fontes.length - activeCount}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* List */}
      <Card>
        <CardHeader>
          <CardTitle>Fontes Monitoradas</CardTitle>
          <CardDescription>
            {fontes.length === 0
              ? "Nenhuma fonte cadastrada"
              : `${fontes.length} fonte${fontes.length !== 1 ? "s" : ""} cadastrada${fontes.length !== 1 ? "s" : ""}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {fontes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <MessageCircle className="size-12 mb-4 opacity-40" />
              <p className="text-sm">
                Nenhuma fonte cadastrada. Adicione sua primeira fonte para
                começar.
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>URL / ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Última verificação</TableHead>
                    <TableHead>Ofertas</TableHead>
                    <TableHead>Publicadas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fontes.map((fonte) => (
                    <TableRow key={fonte.id} className="hover:bg-brand-pink/5 transition-colors cursor-pointer">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <MessageCircle className="size-4 text-muted-foreground shrink-0" />
                          {fonte.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                        {fonte.url}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            fonte.isActive
                              ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30"
                              : "bg-muted text-muted-foreground"
                          }
                        >
                          {fonte.isActive ? (
                            <CheckCircle2 className="size-3 mr-1 inline" />
                          ) : (
                            <XCircle className="size-3 mr-1 inline" />
                          )}
                          {fonte.isActive ? "Ativa" : "Inativa"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {fonte.lastChecked.toLocaleDateString("pt-BR", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell>{fonte.totalOffersFound}</TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1">
                          <Eye className="size-3 text-muted-foreground" />
                          {fonte.totalOffersPublished}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
