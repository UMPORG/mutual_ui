import { hydrateRoot } from "react-dom/client";
import { CaixasSsr } from "./ssr";

hydrateRoot(document.getElementById("ssr")!, <CaixasSsr />);
document.documentElement.setAttribute("data-hidratado", "");
