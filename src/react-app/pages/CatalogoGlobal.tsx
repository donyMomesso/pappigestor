import { useState, useMemo } from "react";
import { Search, Plus, Loader2, AlertCircle, Globe, Barcode, Package, Filter, ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/react-app/components/ui/card";
import { Button } from "@/react-app/components/ui/button";
import { Input } from "@/react-app/components/ui/input";
import { PRODUTOS_FOOD_SERVICE, CATEGORIAS_FOOD_SERVICE, type ProdutoFoodService } from "@/data/produtos-food-service";

interface OpenFoodFactsProduct {
  code: string;
  product_name: string;
  brands: string;
  categories: string;
  image_url?: string;
  nutriscore_grade?: string;
  quantity?: string;
}

export default function CatalogoGlobalPage() {
  // Food Service search
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoria, setSelectedCategoria] = useState<string>("");
  const [addingProduct, setAddingProduct] = useState<string | null>(null);

  // Open Food Facts search
  const [onlineBarcode, setOnlineBarcode] = useState("");
  const [onlineSearching, setOnlineSearching] = useState(false);
  const [onlineProduct, setOnlineProduct] = useState<OpenFoodFactsProduct | null>(null);
  const [onlineError, setOnlineError] = useState("");
  const [addingOnlineProduct, setAddingOnlineProduct] = useState(false);

  // Filter products
  const filteredProducts = useMemo(() => {
    let products = PRODUTOS_FOOD_SERVICE;
    
    if (selectedCategoria) {
      products = products.filter(p => p.categoria === selectedCategoria);
    }
    
    if (searchTerm.length >= 2) {
      const termo = searchTerm.toLowerCase();
      products = products.filter(
        p =>
          p.nome.toLowerCase().includes(termo) ||
          p.descricao.toLowerCase().includes(termo)
      );
    }
    
    return products;
  }, [searchTerm, selectedCategoria]);

  // Group by category for display
  const productsByCategory = useMemo(() => {
    const grouped: Record<string, ProdutoFoodService[]> = {};
    filteredProducts.forEach(p => {
      if (!grouped[p.categoria]) grouped[p.categoria] = [];
      grouped[p.categoria].push(p);
    });
    return grouped;
  }, [filteredProducts]);

  const handleAddFoodServiceProduct = async (product: ProdutoFoodService) => {
    setAddingProduct(product.id);
    try {
      const response = await fetch("/api/produtos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome_produto: product.nome,
          categoria_produto: product.categoria,
          unidade_medida: product.unidadeMedida,
          descricao: `${product.descricao}. Embalagem: ${product.embalagem}. Peso aprox.: ${product.pesoAprox}`,
        }),
      });

      if (response.ok) {
        alert(`Produto "${product.nome}" adicionado ao cadastro!`);
      } else {
        const err = await response.json();
        alert(err.error || "Erro ao adicionar produto");
      }
    } catch {
      alert("Erro ao adicionar produto");
    }
    setAddingProduct(null);
  };

  const handleOnlineSearch = async () => {
    const barcode = onlineBarcode.replace(/\D/g, "");
    if (!barcode) return;

    setOnlineSearching(true);
    setOnlineProduct(null);
    setOnlineError("");

    try {
      const response = await fetch(`/api/openfoodfacts/product/${barcode}`);
      const data = await response.json();

      if (data.status === 1 && data.product) {
        setOnlineProduct({
          code: data.code,
          product_name: data.product.product_name || data.product.product_name_pt || data.product.product_name_en || "Sem nome",
          brands: data.product.brands || "",
          categories: data.product.categories || "",
          image_url: data.product.image_url || data.product.image_front_url,
          nutriscore_grade: data.product.nutriscore_grade,
          quantity: data.product.quantity,
        });
      } else {
        setOnlineError("Produto não encontrado. Verifique o código de barras.");
      }
    } catch {
      setOnlineError("Erro ao buscar produto. Tente novamente.");
    }
    setOnlineSearching(false);
  };

  const handleAddOnlineProduct = async () => {
    if (!onlineProduct) return;

    setAddingOnlineProduct(true);
    try {
      const response = await fetch("/api/produtos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome_produto: onlineProduct.product_name,
          categoria_produto: onlineProduct.categories?.split(",")[0]?.trim() || "Outros",
          unidade_medida: "UN",
          codigo_barras: onlineProduct.code,
        }),
      });

      if (response.ok) {
        alert(`Produto "${onlineProduct.product_name}" adicionado ao cadastro!`);
        setOnlineProduct(null);
        setOnlineBarcode("");
      } else {
        const err = await response.json();
        alert(err.error || "Erro ao adicionar produto");
      }
    } catch {
      alert("Erro ao adicionar produto");
    }
    setAddingOnlineProduct(false);
  };

  const getCategoryIcon = (categoria: string) => {
    if (categoria.includes("Proteínas")) return "🥩";
    if (categoria.includes("Embutidos")) return "🥓";
    if (categoria.includes("Laticínios")) return "🧀";
    if (categoria.includes("Congelados")) return "🥬";
    if (categoria.includes("Mercearia")) return "🫒";
    return "📦";
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2 dark:text-white">
          <Globe className="w-7 h-7 text-orange-600" />
          Catálogo Global de Produtos
        </h1>
        <p className="text-muted-foreground mt-1">
          Pesquise e importe produtos do catálogo Food Service ou por código de barras
        </p>
      </div>

      {/* Food Service Catalog Section */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-white">
            <Package className="w-5 h-5 text-orange-600" />
            Catálogo Food Service (Atacado)
          </CardTitle>
          <CardDescription className="dark:text-gray-400">
            {PRODUTOS_FOOD_SERVICE.length} produtos cadastrados para restaurantes e pizzarias
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <select
                value={selectedCategoria}
                onChange={(e) => setSelectedCategoria(e.target.value)}
                className="w-full sm:w-56 h-10 pl-10 pr-8 rounded-md border border-input bg-background text-sm appearance-none cursor-pointer dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">Todas as categorias</option>
                {CATEGORIAS_FOOD_SERVICE.map((cat) => (
                  <option key={cat} value={cat}>
                    {getCategoryIcon(cat)} {cat}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Results count */}
          <p className="text-sm text-muted-foreground">
            Exibindo {filteredProducts.length} de {PRODUTOS_FOOD_SERVICE.length} produtos
          </p>

          {/* Products by Category */}
          <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2">
            {Object.entries(productsByCategory).map(([categoria, produtos]) => (
              <div key={categoria}>
                <h3 className="font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2 sticky top-0 bg-white dark:bg-gray-800 py-1">
                  <span className="text-lg">{getCategoryIcon(categoria)}</span>
                  {categoria}
                  <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                    {produtos.length}
                  </span>
                </h3>
                <div className="grid gap-2">
                  {produtos.map((produto) => (
                    <div
                      key={produto.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex-1 min-w-0 mr-3">
                        <h4 className="font-medium text-sm dark:text-white truncate">
                          {produto.nome}
                        </h4>
                        <p className="text-xs text-muted-foreground truncate">
                          {produto.descricao}
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-1.5 py-0.5 rounded">
                            {produto.embalagem}
                          </span>
                          <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded">
                            {produto.pesoAprox}
                          </span>
                          <span className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-1.5 py-0.5 rounded font-mono">
                            {produto.unidadeMedida}
                          </span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddFoodServiceProduct(produto)}
                        disabled={addingProduct === produto.id}
                        className="bg-green-600 hover:bg-green-700 shrink-0"
                      >
                        {addingProduct === produto.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Plus className="w-4 h-4 mr-1" />
                            Adicionar
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {filteredProducts.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum produto encontrado</p>
                <p className="text-sm">Tente ajustar os filtros de busca</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Online Search Section */}
      <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 dark:border-orange-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-white">
            <Barcode className="w-5 h-5 text-orange-600" />
            Buscar por Código de Barras (Open Food Facts)
          </CardTitle>
          <CardDescription className="dark:text-gray-400">
            Digite o código de barras para buscar informações do produto na base mundial
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Digite o código de barras (ex: 7891000100103)"
                value={onlineBarcode}
                onChange={(e) => setOnlineBarcode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleOnlineSearch()}
                className="pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <Button 
              onClick={handleOnlineSearch} 
              disabled={onlineSearching || !onlineBarcode.trim()}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {onlineSearching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Buscar
                </>
              )}
            </Button>
          </div>

          {onlineError && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-900/30 p-3 rounded-lg">
              <AlertCircle className="w-5 h-5" />
              <span>{onlineError}</span>
            </div>
          )}

          {onlineProduct && (
            <div className="flex flex-col md:flex-row gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
              {onlineProduct.image_url && (
                <img
                  src={onlineProduct.image_url}
                  alt={onlineProduct.product_name}
                  className="w-24 h-24 object-contain rounded-lg bg-gray-50 dark:bg-gray-700"
                />
              )}
              <div className="flex-1 space-y-2">
                <h3 className="font-semibold text-lg dark:text-white">{onlineProduct.product_name}</h3>
                <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                  {onlineProduct.brands && (
                    <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                      Marca: {onlineProduct.brands}
                    </span>
                  )}
                  {onlineProduct.quantity && (
                    <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                      {onlineProduct.quantity}
                    </span>
                  )}
                  {onlineProduct.nutriscore_grade && (
                    <span className={`px-2 py-0.5 rounded text-white ${
                      onlineProduct.nutriscore_grade === "a" ? "bg-green-500" :
                      onlineProduct.nutriscore_grade === "b" ? "bg-lime-500" :
                      onlineProduct.nutriscore_grade === "c" ? "bg-yellow-500" :
                      onlineProduct.nutriscore_grade === "d" ? "bg-orange-500" : "bg-red-500"
                    }`}>
                      Nutriscore {onlineProduct.nutriscore_grade.toUpperCase()}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground font-mono">
                  Código: {onlineProduct.code}
                </p>
              </div>
              <Button
                onClick={handleAddOnlineProduct}
                disabled={addingOnlineProduct}
                className="bg-green-600 hover:bg-green-700 self-start"
              >
                {addingOnlineProduct ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Adicionar ao Cadastro
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
