using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class SkyboxController : MonoBehaviour
{
	public Material dusk;
    public Material dawn;
    public Animator ani;

    // Start is called before the first frame update
    void Start()
    {
        RenderSettings.skybox = dusk;
    }

    // Update is called once per frame
    void Update()
    {
        if (Input.GetKeyDown("r"))
        {
        	if (ani.GetBool("Dusk2Dawn"))
            {
                RenderSettings.skybox = dawn;
            }
            else
            {
                RenderSettings.skybox = dusk;
            }
        }
    }
}
