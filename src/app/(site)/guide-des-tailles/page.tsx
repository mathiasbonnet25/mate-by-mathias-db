import { LegalLayout, LegalSection } from "@/components/legal/legal-layout";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Guide des tailles",
  description:
    "Correspondances de tailles pour les cadres, les vêtements, les casques, les gants et les chaussures.",
  path: "/guide-des-tailles",
});

export default function GuideTaillesPage() {
  return (
    <LegalLayout
      title="Guide des tailles"
      updatedAt="16 septembre 2026"
      intro="Ces correspondances sont indicatives : elles varient d'une marque à l'autre. En cas d'hésitation, écrivez-moi avec vos mesures."
    >
      <LegalSection id="cadres" title="Cadres de route">
        <table>
          <thead>
            <tr>
              <th>Taille</th>
              <th>Votre taille</th>
              <th>Entrejambe</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>48</td><td>1,55 – 1,63 m</td><td>72 – 76 cm</td></tr>
            <tr><td>51</td><td>1,63 – 1,70 m</td><td>76 – 80 cm</td></tr>
            <tr><td>54</td><td>1,70 – 1,77 m</td><td>80 – 84 cm</td></tr>
            <tr><td>56</td><td>1,77 – 1,83 m</td><td>84 – 88 cm</td></tr>
            <tr><td>58</td><td>1,83 – 1,89 m</td><td>88 – 92 cm</td></tr>
            <tr><td>61</td><td>1,89 m et plus</td><td>92 cm et plus</td></tr>
          </tbody>
        </table>
        <p>
          Mesurez votre entrejambe pieds nus, dos au mur, en remontant un livre
          fermement contre le périnée. Cette mesure prime sur la taille
          générale : deux personnes de même taille peuvent avoir besoin de
          cadres différents.
        </p>
      </LegalSection>

      <LegalSection id="vetements" title="Vêtements">
        <table>
          <thead>
            <tr>
              <th>Taille</th>
              <th>Poitrine</th>
              <th>Tour de taille</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>XS</td><td>86 – 91 cm</td><td>71 – 76 cm</td></tr>
            <tr><td>S</td><td>91 – 96 cm</td><td>76 – 81 cm</td></tr>
            <tr><td>M</td><td>96 – 101 cm</td><td>81 – 86 cm</td></tr>
            <tr><td>L</td><td>101 – 107 cm</td><td>86 – 94 cm</td></tr>
            <tr><td>XL</td><td>107 – 114 cm</td><td>94 – 102 cm</td></tr>
            <tr><td>XXL</td><td>114 – 122 cm</td><td>102 – 110 cm</td></tr>
          </tbody>
        </table>
        <p>
          Les coupes de cyclisme sont ajustées par construction. Si vous
          hésitez entre deux tailles et privilégiez le confort, prenez la plus
          grande.
        </p>
      </LegalSection>

      <LegalSection id="casques" title="Casques et gants">
        <table>
          <thead>
            <tr>
              <th>Taille</th>
              <th>Tour de tête (casque)</th>
              <th>Tour de main (gants)</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>S</td><td>51 – 55 cm</td><td>18 – 19 cm</td></tr>
            <tr><td>M</td><td>55 – 58 cm</td><td>19 – 21 cm</td></tr>
            <tr><td>L</td><td>58 – 62 cm</td><td>21 – 23 cm</td></tr>
          </tbody>
        </table>
        <p>
          Le tour de tête se mesure à un centimètre au-dessus des sourcils, au
          point le plus large du crâne.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
