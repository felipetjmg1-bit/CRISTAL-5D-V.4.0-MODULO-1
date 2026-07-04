import { StorageScene, SceneConfig } from '../types';

export const SCENES_DATA: Record<StorageScene, SceneConfig> = {
  [StorageScene.RAW_SOURCE]: {
    id: StorageScene.RAW_SOURCE,
    number: 1,
    title: "A Fonte de Matéria-Prima",
    subtitle: "Sílica de Quartzo Cristalizada Naturalmente",
    imagePath: "/src/assets/images/scene_1_raw_source_1782947602269.jpg",
    promptText: `[SCENE 1: THE RAW SOURCE] Extreme macro shot of a hand holding a large, raw, jagged Brazilian Quartz crystal. The mineral must look rough, with inclusions. The background is a clean, hyper-modern processing facility with Sistema Aurora Soberano logos faintly visible. Focus on the raw mineral texture. Style: High-end Cinematic, Photorealistic 8K, Industrial Sci-Fi Documentary.`,
    narration: "Nossa jornada começa com a perfeição geológica em estado bruto. Extraídos das profundezas minerais do Brasil, estes aglomerados de cristais de quartzo possuem a estrutura de Dióxido de Silício de alta pureza necessária para a ressonância óptica eterna. Mesmo aqui, congelados na pedra, os arranjos atômicos naturais do mineral aguardam o despertar digital.",
    styleNotes: [
      "Foco macro extremo nas faces do quartzo bruto",
      "Fundo industrial sutil (aço escovado, tons dourados)",
      "Iluminação documental de alto contraste com sombras profundas"
    ],
    scientificBase: {
      title: "Pureza de Sílica Geológica",
      description: "O Dióxido de Silício (SiO2) em sua forma cristalina natural oferece uma transparência óptica excepcional e durabilidade mecânica extrema, tornando-o o meio bruto perfeito para alterações moleculares de longo prazo.",
      parameters: [
        { name: "Tipo de Mineral", value: "Quartzo Alfa (SiO2)" },
        { name: "Pureza Inicial", value: "99.8%" },
        { name: "Simetria Cristalina", value: "Trigonal" },
        { name: "Origem", value: "Minas Gerais, Brasil" }
      ]
    }
  },
  [StorageScene.MINING_PURITY]: {
    id: StorageScene.MINING_PURITY,
    number: 2,
    title: "Da Mineração à Pureza",
    subtitle: "Lapidação de Precisão com Diamante e Ultra-Purificação",
    imagePath: "/src/assets/images/scene_2_mining_purity_1782947615571.jpg",
    promptText: `[SCENE 2: MINING TO PURITY] A rapid montage: (1) A robotic arm with a diamond-tip cutter precisely shapes the raw quartz. (2) A chemical bath sequence, where the cut quartz is submerged in an iridescent liquid, dissolving impurities. The quartz becomes exponentially clearer. (3) A close-up of the final quartz slab: a perfect, transparent wafer, entirely flaw-free. Style: High-end Cinematic, Photorealistic 8K, Industrial Sci-Fi Documentary.`,
    narration: "O quartzo bruto passa por usinagem automatizada de alta precisão. Braços robóticos com lâminas de ponta de diamante eliminam imperfeições externas, fatiando o cristal em discos circulares perfeitos. Um banho químico especializado de purificação ácida dissolve quaisquer inclusões de metais pesados restantes, resultando em um disco de vidro com transparência molecular absoluta.",
    styleNotes: [
      "Movimentos robóticos de precisão, faíscas no corte com diamante",
      "Líquido purificador borbulhante com reflexos iridescentes",
      "Transparência extrema e definição de bordas cristalinas"
    ],
    scientificBase: {
      title: "Purificação Sub-Nanométrica",
      description: "Os discos de quartzo são polidos até atingirem uma rugosidade superficial inferior a 0,5 nanômetros. Lavagens químicas a quente removem impurezas atômicas, garantindo que os feixes de laser possam penetrar profundamente sem dispersão.",
      parameters: [
        { name: "Rugosidade Superficial", value: "< 0.5", unit: "nm" },
        { name: "Nível de Pureza Final", value: "99.9999%" },
        { name: "Diâmetro do Disco", value: "120", unit: "mm" },
        { name: "Espessura do Disco", value: "2.4", unit: "mm" }
      ]
    }
  },
  [StorageScene.ELEMENT_INJECTION]: {
    id: StorageScene.ELEMENT_INJECTION,
    number: 3,
    title: "Injeção de Elementos",
    subtitle: "Dopagem com Érbio e Niobato de Lítio",
    imagePath: "/src/assets/images/scene_3_element_injection_1782947629135.jpg",
    promptText: `[SCENE 3: INJECTION OF THE ELEMENTS] Inside a chamber filled with a deep blue atmospheric glow. A specialized machine holds the ultra-pure quartz wafer. Two micro-cannulas approach the crystal surface. They inject microscopic amounts of Érbio (Erbium) and Niobato de Lítio (Lithium Niobate). The quartz slab shows subtle, internal colorful ripples where the elements fuse with the silicon structure. The crystal now has a distinctive, subtle opalescent core. Style: High-end Cinematic, Photorealistic 8K, Industrial Sci-Fi Documentary.`,
    narration: "Dentro de uma câmara atmosférica pressurizada sob luz azul, a sílica purificada é dopada. Cânulas de alta precisão injetam traços de íons de Érbio e Niobato de Lítio diretamente na estrutura cristalina. Esta fusão química altera a rede atômica, criando um núcleo opalescente sutil com uma resposta óptica altamente especializada.",
    styleNotes: [
      "Iluminação da câmara em azul cobalto profundo",
      "Microcânulas metálicas com acabamento polido",
      "Núcleos opalescentes mutáveis e ondulações internas coloridas"
    ],
    scientificBase: {
      title: "Dopagem com Terras Raras",
      description: "Os íons de Érbio fornecem uma estrutura especializada de níveis de energia para amplificação óptica, enquanto o Niobato de Lítio introduz fortes propriedades ópticas não lineares, permitindo absorção de múltiplos fótons e modificações no índice de refração local.",
      parameters: [
        { name: "Elemento Dopante 1", value: "Íons de Érbio (Er³⁺)" },
        { name: "Elemento Dopante 2", value: "Niobato de Lítio (LiNbO3)" },
        { name: "Concentração da Dose", value: "120", unit: "ppm" },
        { name: "Temp. de Fusão", value: "1150", unit: "°C" }
      ]
    }
  },
  [StorageScene.FIVE_D_ENCODING]: {
    id: StorageScene.FIVE_D_ENCODING,
    number: 4,
    title: "A Gravação em 5D",
    subtitle: "Escrita com Laser de Femtossegundo",
    imagePath: "/src/assets/images/scene_4_5d_encoding_1782947641110.jpg",
    promptText: `[SCENE 4: THE WRITING PROCESS - 5D ENCODING] An extreme macro, close-up shot of the crystal wafer. A powerful laser beam, pulsing rapidly, hits the surface. The laser interaction with the mineral structure is shown as intricate, geometric patterns of light and fractal shapes forming *inside* the crystal bulk. This is the 5D encoding. The light changes as it moves through the depth (representing the two extra layers of information). Show the complex, 3D lattice data structure emerging, captured as light inside the glass. The camera moves through the structure. Style: High-end Cinematic, Photorealistic 8K, Industrial Sci-Fi Documentary.`,
    narration: "Um laser de femtossegundo ultrarrápido emite pulsos direcionados a pontos focais específicos dentro do quartzo. Esses pulsos criam nanoestruturas microscópicas permanentes, chamadas voxels. Ao alterar três coordenadas espaciais (X, Y e Z) somadas a dois parâmetros ópticos (ângulo de polarização e retardo do laser), os dados em cinco dimensões são congelados no tempo.",
    styleNotes: [
      "Pulsos brilhantes de laser verde esmeralda e violeta",
      "Microfissuras geométricas gerando estruturas luminosas",
      "Percurso de câmera por células de dados em grade 3D cintilante"
    ],
    scientificBase: {
      title: "Parâmetros Pentadimensionais",
      description: "Os dados são codificados em cinco dimensões físicas: três coordenadas espaciais (X, Y, Z), o ângulo de polarização (θ) e a intensidade/retardo do laser (I). Isso permite que um único disco armazene até 360 Terabytes por bilhões de anos.",
      parameters: [
        { name: "Duração do Pulso", value: "280", unit: "fs" },
        { name: "Comprimento de Onda", value: "515 (Verde)", unit: "nm" },
        { name: "Dimensões dos Dados", value: "5 (X, Y, Z, θ, I)" },
        { name: "Espaçamento de Escrita", value: "1.2", unit: "μm" }
      ]
    }
  },
  [StorageScene.FINAL_PRODUCT]: {
    id: StorageScene.FINAL_PRODUCT,
    number: 5,
    title: "Produto Final e Escala",
    subtitle: "Armazenamento Permanente e Soberania Tecnológica",
    imagePath: "/src/assets/images/scene_5_final_product_1782947653565.jpg",
    promptText: `[SCENE 5: FINAL PRODUCT & SCALE] A robotic arm moves the completed, engraved 5D Crystal wafer. It places it on a pedestal in a pristine, zero-energy storage rack. The rack is filled with other similar wafers. A digital holographic overlay appears, displaying the data type: 'DREX NETWORK DATA'. The shot pulls back to reveal an massive, cool-lit, silent room. The camera angle looks out a window: a futuristic, fully electric Sistema Aurora Soberano electric delivery vehicle is parked, waiting. The overall feel is 'Technological Sovereignty' and 'Green Technology'. Style: High-end Cinematic, Photorealistic 8K, Industrial Sci-Fi Documentary.`,
    narration: "O disco de cristal 5D finalizado é colocado em uma gaveta de armazenamento com consumo zero de energia. Virtualmente indestrutível, ele não requer resfriamento ou eletricidade, suportando temperaturas de até mil graus Celsius. Gravados ali estão os registros históricos da rede financeira DREX do Brasil: um sistema de soberania tecnológica eterna, feito para resistir por gerações.",
    styleNotes: [
      "Corredores infinitos de servidores e gavetas de armazenamento",
      "Hologramas informativos azuis e telemetria sutil",
      "Veículos logísticos elétricos e sustentáveis na área externa"
    ],
    scientificBase: {
      title: "Cofre Eterno de Energia Zero",
      description: "O armazenamento em quartzo requer zero eletricidade ou controle climático, evitando milhões de toneladas de emissões de carbono. Ele resiste a incêndios, inundações e pulsos eletromagnéticos (EMPs), garantindo a longevidade absoluta do banco de dados soberano.",
      parameters: [
        { name: "Durabilidade dos Dados", value: "13.8 Bilhões", unit: "anos" },
        { name: "Resistência Térmica", value: "1000", unit: "°C" },
        { name: "Densidade", value: "360", unit: "TB/Disco" },
        { name: "Energia Requerida", value: "0", unit: "Watts" }
      ]
    }
  }
};
