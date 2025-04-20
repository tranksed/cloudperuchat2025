import Plan from "../../models/Plan";

export type IParamsSearch = {
  isPublic?: boolean
}

const FindAllPublicPlanService = async ({isPublic = true}: IParamsSearch = {}): Promise<Plan[]> => {
  const plans = await Plan.findAll({
    where:{
      isPublic
    },
    order: [["name", "ASC"]]
  });
  return plans;
};

export default FindAllPublicPlanService;
