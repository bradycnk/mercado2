import { ChartPie, Shirt, Laptop, Home, Car, Book, Music, Utensils,  Dumbbell,  Baby, Hammer } from 'lucide-react';

export const BCV_RATE = 45.00; // Example rate, should come from an API in production

export const CATEGORIES = [
  "Electrónica",
  "Ropa y Moda",
  "Hogar y Muebles",
  "Vehículos y Repuestos",
  "Libros y Papelería",
  "Instrumentos Musicales",
  "Alimentos y Bebidas",
  "Deportes y Fitness",
  "Bebés y Juguetes",
  "Herramientas y Construcción"
];

export const CATEGORY_ICONS: Record<string, any> = {
  "Electrónica": Laptop,
  "Ropa y Moda": Shirt,
  "Hogar y Muebles": Home,
  "Vehículos y Repuestos": Car,
  "Libros y Papelería": Book,
  "Instrumentos Musicales": Music,
  "Alimentos y Bebidas": Utensils,
  "Deportes y Fitness": Dumbbell,
  "Bebés y Juguetes": Baby,
  "Herramientas y Construcción": Hammer
};