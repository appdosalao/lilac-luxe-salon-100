import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Package, Users, ShoppingCart, TrendingUp, Tag, DollarSign } from 'lucide-react';
import { ProdutosList } from '@/components/produtos/ProdutosList';
import { FornecedoresList } from '@/components/produtos/FornecedoresList';
import { ComprasList } from '@/components/produtos/ComprasList';

import { CategoriasList } from '@/components/produtos/CategoriasList';
import { VendasList } from '@/components/produtos/VendasList';
import { useSupabaseProdutos } from '@/hooks/useSupabaseProdutos';
import { useSupabaseCompras } from '@/hooks/useSupabaseCompras';
import { useSupabaseVendas } from '@/hooks/useSupabaseVendas';

export default function Produtos() {
  const [activeTab, setActiveTab] = useState('produtos');
  const { produtos } = useSupabaseProdutos();
  const { compras } = useSupabaseCompras();
  const { vendas } = useSupabaseVendas();

  const estatisticas = {
    totalProdutos: produtos.length,
    produtosAtivos: produtos.filter(p => p.ativo).length,
    estoqueTotal: produtos.reduce((sum, p) => sum + p.estoque_atual, 0),
    comprasRealizadas: compras.length,
    vendasRealizadas: vendas.length,
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Produtos e Estoque</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Gerencie seus produtos, fornecedores e movimentações de estoque
          </p>
        </div>
      </div>

      {/* Dashboard de estatísticas - Responsivo */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        <Card className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
            <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
              <Package className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground truncate">Total de Produtos</p>
              <p className="text-xl sm:text-2xl font-bold">{estatisticas.totalProdutos}</p>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg flex-shrink-0">
              <Package className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground truncate">Produtos Ativos</p>
              <p className="text-xl sm:text-2xl font-bold">{estatisticas.produtosAtivos}</p>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg flex-shrink-0">
              <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground truncate">Estoque Total</p>
              <p className="text-xl sm:text-2xl font-bold">{estatisticas.estoqueTotal}</p>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg flex-shrink-0">
              <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground truncate">Compras Realizadas</p>
              <p className="text-xl sm:text-2xl font-bold">{estatisticas.comprasRealizadas}</p>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
            <div className="p-2 bg-orange-500/10 rounded-lg flex-shrink-0">
              <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground truncate">Vendas Realizadas</p>
              <p className="text-xl sm:text-2xl font-bold">{estatisticas.vendasRealizadas}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs - Scrolláveis em mobile */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="relative">
          <TabsList className="w-full">
            <TabsTrigger value="produtos" className="gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden xs:inline">Produtos</span>
            </TabsTrigger>
            <TabsTrigger value="fornecedores" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden xs:inline">Fornecedores</span>
            </TabsTrigger>
            <TabsTrigger value="compras" className="gap-2">
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden xs:inline">Compras</span>
            </TabsTrigger>
            <TabsTrigger value="categorias" className="gap-2">
              <Tag className="h-4 w-4" />
              <span className="hidden xs:inline">Categorias</span>
            </TabsTrigger>
            <TabsTrigger value="vendas" className="gap-2">
              <DollarSign className="h-4 w-4" />
              <span className="hidden xs:inline">Vendas</span>
            </TabsTrigger>
          </TabsList>
          {/* Indicador de scroll em mobile */}
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none sm:hidden" />
        </div>

        <TabsContent value="produtos" className="space-y-4">
          <ProdutosList />
        </TabsContent>

        <TabsContent value="fornecedores" className="space-y-4">
          <FornecedoresList />
        </TabsContent>

        <TabsContent value="compras" className="space-y-4">
          <ComprasList />
        </TabsContent>

        <TabsContent value="categorias" className="space-y-4">
          <CategoriasList />
        </TabsContent>

        <TabsContent value="vendas" className="space-y-4">
          <VendasList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
