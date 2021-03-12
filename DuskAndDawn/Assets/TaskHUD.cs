using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

public class TaskHUD : MonoBehaviour
{
	[SerializeField]
    Metadata _metadata;

	private Canvas canvas;
    private bool show = false;

    private Metadata metadata;

    // Start is called before the first frame update
    void Start()
    {
        canvas = gameObject.GetComponent<Canvas>();
        canvas.enabled = show;
    }

    // Update is called once per frame
    void Update()
    {
        if (Input.GetKeyDown("t") && !_metadata.duskInDialog && !_metadata.dawnInDialog)
        {
            show = !show;
            canvas.enabled = show;
        }
    }
}
