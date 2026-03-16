export type RouteVideo = {
  routeNumber: number;
  youtubeId: string;
  title: string;
  channel: string;
  duration?: string;
};

export type City = {
  id: string;
  name: string;
  routeNumbers: number[];
  videos: RouteVideo[];
  mapPdfUrl?: string; // sa.gov.ge PDF link
};

export type CityRoute = {
  routeNumber: number;
  video: RouteVideo | null;
};

const createSequentialRouteNumbers = (lastRouteNumber: number) =>
  Array.from({ length: lastRouteNumber }, (_, index) => index + 1);

export const CITIES: City[] = [
  {
    id: "rustavi",
    name: "რუსთავი",
    routeNumbers: createSequentialRouteNumbers(8),
    videos: [
      {
        routeNumber: 1,
        youtubeId: "3P0FoAtfkYI",
        title: "რუსთავი — მარშრუტი N1",
        channel: "REVERSEDRIVE",
      },
      {
        routeNumber: 2,
        youtubeId: "M055HI4SLDY",
        title: "რუსთავი — მარშრუტი N2",
        channel: "REVERSEDRIVE",
      },
      {
        routeNumber: 3,
        youtubeId: "39A5CEFDnSs",
        title: "რუსთავი — მარშრუტი N3",
        channel: "REVERSEDRIVE",
      },
      {
        routeNumber: 4,
        youtubeId: "vvAHDoMqFxk",
        title: "რუსთავი — მარშრუტი N4",
        channel: "REVERSEDRIVE",
      },
      {
        routeNumber: 5,
        youtubeId: "aTXCREHshHM",
        title: "რუსთავი — მარშრუტი N5",
        channel: "REVERSEDRIVE",
      },
      {
        routeNumber: 6,
        youtubeId: "XID-eambhBw",
        title: "რუსთავი — მარშრუტი N6",
        channel: "REVERSEDRIVE",
      },
      {
        routeNumber: 7,
        youtubeId: "Rvd4pryw3fs",
        title: "რუსთავი — მარშრუტი N7",
        channel: "REVERSEDRIVE",
      },
      {
        routeNumber: 8,
        youtubeId: "7EX33mkP-fg",
        title: "რუსთავი — მარშრუტი N8",
        channel: "REVERSEDRIVE",
      },
    ],
  },
  {
    id: "gori",
    name: "გორი",
    routeNumbers: createSequentialRouteNumbers(4),
    videos: [
      {
        routeNumber: 1,
        youtubeId: "fEEtT_hxyk4",
        title: "გორი — მარშრუტი 1",
        channel: "YouTube",
      },
      {
        routeNumber: 2,
        youtubeId: "XOA7gvkhj7k",
        title: "გორი — მარშრუტი 2",
        channel: "YouTube",
      },
      {
        routeNumber: 3,
        youtubeId: "S-jKgNevDxg",
        title: "გორი — მარშრუტი 3",
        channel: "YouTube",
      },
      {
        routeNumber: 4,
        youtubeId: "tMMHtllMsLk",
        title: "გორი — მარშრუტი 4",
        channel: "YouTube",
      },
    ],
  },
  {
    id: "telavi",
    name: "თელავი",
    routeNumbers: createSequentialRouteNumbers(5),
    videos: [
      {
        routeNumber: 1,
        youtubeId: "oFCzUjdwSVY",
        title: "თელავი — მარშრუტი 1",
        channel: "მიხეილ აბრამიშვილი",
        duration: "26:11",
      },
      {
        routeNumber: 2,
        youtubeId: "1B5U7LLH3FQ",
        title: "თელავი — მარშრუტი 2",
        channel: "მიხეილ აბრამიშვილი",
        duration: "20:59",
      },
      {
        routeNumber: 3,
        youtubeId: "-ZXEyosmyhw",
        title: "თელავი — მარშრუტი 3",
        channel: "მიხეილ აბრამიშვილი",
        duration: "25:58",
      },
      {
        routeNumber: 4,
        youtubeId: "OKY8YO7BHRs",
        title: "თელავი — მარშრუტი 4",
        channel: "მიხეილ აბრამიშვილი",
        duration: "22:43",
      },
      {
        routeNumber: 5,
        youtubeId: "bTteOPHqRq4",
        title: "თელავი — მარშრუტი 5",
        channel: "მიხეილ აბრამიშვილი",
        duration: "17:49",
      },
    ],
  },
  {
    id: "sachkhere",
    name: "საჩხერე",
    routeNumbers: createSequentialRouteNumbers(7),
    videos: [
      {
        routeNumber: 1,
        youtubeId: "Pshf2b_pWCY",
        title: "საჩხერე — მარშრუტი 1",
        channel: "ავტოსკოლა Greenlight",
        duration: "27:27",
      },
      {
        routeNumber: 0,
        youtubeId: "YeOWlR_xnCg",
        title: "საჩხერე — მძღოლის თვალით",
        channel: "ავტოსკოლა Greenlight",
      },
    ],
  },
  {
    id: "ozurgeti",
    name: "ოზურგეთი",
    routeNumbers: createSequentialRouteNumbers(3),
    videos: [
      {
        routeNumber: 1,
        youtubeId: "_gEfq18uzEI",
        title: "ოზურგეთი — მარშრუტი 1",
        channel: "Pavel HZ",
        duration: "20:00",
      },
    ],
  },
  {
    id: "kutaisi",
    name: "ქუთაისი",
    routeNumbers: createSequentialRouteNumbers(4),
    videos: [
      {
        routeNumber: 1,
        youtubeId: "wbxSTyHb4Ig",
        title: "ქუთაისი — მარშრუტი 1",
        channel: "YouTube",
      },
      {
        routeNumber: 2,
        youtubeId: "p22LJu4a7H0",
        title: "ქუთაისი — მარშრუტი 2",
        channel: "YouTube",
      },
      {
        routeNumber: 3,
        youtubeId: "ouAvki_OLa8",
        title: "ქუთაისი — მარშრუტი 3",
        channel: "YouTube",
      },
      {
        routeNumber: 4,
        youtubeId: "muFE80y0rhY",
        title: "ქუთაისი — მარშრუტი 4",
        channel: "YouTube",
      },
    ],
  },
  {
    id: "batumi",
    name: "ბათუმი",
    routeNumbers: createSequentialRouteNumbers(3),
    videos: [],
  },
  {
    id: "zugdidi",
    name: "ზუგდიდი",
    routeNumbers: createSequentialRouteNumbers(3),
    videos: [],
  },
  {
    id: "poti",
    name: "ფოთი",
    routeNumbers: [1, 2, 3, 6],
    videos: [],
  },
  {
    id: "akhaltsikhe",
    name: "ახალციხე",
    routeNumbers: createSequentialRouteNumbers(3),
    videos: [],
  },
];

export const getCityRoutes = (city: City): CityRoute[] =>
  city.routeNumbers.map((routeNumber) => ({
    routeNumber,
    video:
      city.videos.find((video) => video.routeNumber === routeNumber) ?? null,
  }));
