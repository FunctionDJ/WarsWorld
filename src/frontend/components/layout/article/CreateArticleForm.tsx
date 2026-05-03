import type { ArticleCategory } from "@prisma/client";
import { TRPCClientError } from "@trpc/client";
import { usePlayers } from "frontend/context/players";
import { stringToSlug } from "frontend/utils/articleUtils";
import { trpc } from "frontend/utils/trpc-client";
import Link from "next/link";
import { useState, type Dispatch, type SetStateAction, type SubmitEvent } from "react";
import { articleSchema, type ArticleCategories } from "shared/schemas/article";
import { ZodError } from "zod";
import Select, { type SelectOption } from "../Select";
import SquareButton from "../SquareButton";
import OrangeGradientLine from "../decorations/OrangeGradientLine";
import ErrorSuccessBlock from "../forms/ErrorSuccessBlock";
import FormInput from "../forms/FormInput";
import TextAreaInput from "../forms/TextAreaInput";

const CATEGORIES = [
  { label: "News", value: "news" },
  { label: "Patch", value: "patch" },
  { label: "Events", value: "events" },
  { label: "Maintenance", value: "maintenance" },
  { label: "Site", value: "site" },
  { label: "Basics", value: "basics" },
  { label: "Advance", value: "advance" },
] satisfies { label: string; value: ArticleCategories }[];

interface ArticleData {
  title: string;
  description: string;
  thumbnail: string;
  body: string;
  category: string;
}

interface Props {
  articleData: ArticleData;
  setArticleData: Dispatch<SetStateAction<ArticleData>>;
}

export default function CreateArticleForm({ articleData, setArticleData }: Props) {
  const { currentPlayer } = usePlayers();

  const [categoryOption, setCategoryOption] = useState<SelectOption | undefined>({
    label: "Patch",
    value: "patch",
  });
  const [formErrors, setFormErrors] = useState<ZodError>();
  const [error, setError] = useState("");
  const [newstCreatedArticleLink, setNewestCreatedArticleLink] = useState("");

  const { mutateAsync: createArticle, isSuccess } = trpc.article.create.useMutation();

  const clearForm = () => {
    setArticleData({
      title: "",
      description: "",
      category: "patch",
      body: "",
      thumbnail: "",
    });
    setCategoryOption({ label: "Patch", value: "patch" });
    setError("");
  };

  const onSubmitArticleForm = async (event: SubmitEvent) => {
    event.preventDefault();

    try {
      const parsedArticle = articleSchema.parse({
        title: articleData.title.trim(),
        description: articleData.description.trim(),
        body: articleData.body.trim(),
        thumbnail: articleData.thumbnail.trim(),
        category: articleData.category as ArticleCategory,
      });

      const newArticle = await createArticle({
        ...parsedArticle,
        playerId: currentPlayer?.id ?? "",
      });

      setNewestCreatedArticleLink(`${String(newArticle.id)}/${stringToSlug(newArticle.title)}`);
      setFormErrors(undefined);
      clearForm();
    } catch (err) {
      if (err instanceof ZodError) {
        setFormErrors(err);
      } else if (err instanceof TRPCClientError) {
        setError(err.message);
      } else {
        setError("There was an error while trying to post the article. Please try again.");
      }
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onChangeGenericHandler = (identifier: string, value: string) => {
    setArticleData((prevData) => ({
      ...prevData,
      [identifier]: value,
    }));
  };

  const titleError = formErrors?.issues.find((error) => error.path[0] == "title");
  const descriptionError = formErrors?.issues.find((error) => error.path[0] == "description");
  const thumbnailError = formErrors?.issues.find((error) => error.path[0] == "thumbnail");
  const bodyError = formErrors?.issues.find((error) => error.path[0] == "body");

  return (
    <>
      <OrangeGradientLine />
      <form
        className="tw:px-4 tw:smallscreen:px-32 tw:py-10 tw:bg-black/70"
        onSubmit={(event) => {
          void onSubmitArticleForm(event);
        }}
      >
        {isSuccess && (
          <Link className="tw:text-white tw:hover:text-white" href={newstCreatedArticleLink}>
            <ErrorSuccessBlock
              className="tw:h-28 tw:mb-8 tw:hover:translate-y-1 tw:duration-300"
              title="Article successfully created"
              message="Click this box to see the newest article."
            />
          </Link>
        )}
        {error && <ErrorSuccessBlock className="tw:h-20 tw:mb-8" title={error} isError />}
        <div className="tw:grid tw:grid-flow-row tw:grid-cols-4">
          <FormInput
            value={articleData.title}
            onChange={(event) => {
              onChangeGenericHandler("title", event.target.value);
            }}
            className="tw:my-4 tw:w-full tw:mb-8 tw:col-span-4 tw:smallscreen:col-span-3"
            text="Title"
            type="text"
            isError={titleError != undefined}
            errorMessage={titleError?.message}
          />
          <div className="tw:my-4 tw:smallscreen:my-0 tw:smallscreen:ml-12 tw:col-span-4 tw:smallscreen:col-span-1">
            <label htmlFor="" className={`tw:text-xl tw:smallscreen:text-2xl tw:text-white`}>
              Category
            </label>
            <Select
              className="tw:my-5 tw:w-full tw:h-16 tw:text-2xl"
              options={CATEGORIES}
              value={categoryOption}
              onChange={(o) => {
                setCategoryOption(o);
                onChangeGenericHandler("category", o?.value.toString() ?? "");
              }}
            />
          </div>
          <TextAreaInput
            value={articleData.description}
            onChange={(event) => {
              onChangeGenericHandler("description", event.target.value);
            }}
            className="tw:col-span-4"
            text="Description"
            height="20rem"
            isError={descriptionError != undefined}
            errorMessage={descriptionError?.message}
          />
          <FormInput
            value={articleData.thumbnail}
            onChange={(event) => {
              onChangeGenericHandler("thumbnail", event.target.value);
            }}
            className="tw:mt-8 tw:col-span-4"
            type="text"
            text="Thumbnail"
            isError={thumbnailError != undefined}
            errorMessage={thumbnailError?.message}
          />

          <TextAreaInput
            value={articleData.body}
            onChange={(event) => {
              onChangeGenericHandler("body", event.target.value);
            }}
            className="tw:col-span-4 tw:mt-12"
            text="Content"
            height="50rem"
            isError={bodyError != undefined}
            errorMessage={bodyError?.message}
          />
        </div>

        <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:pt-4 tw:px-10">
          <div className="tw:w-[80vw] tw:smallscreen:w-96 tw:h-20 tw:text-5xl tw:my-2">
            <SquareButton>Submit</SquareButton>
          </div>
        </div>
      </form>
      <OrangeGradientLine />
    </>
  );
}
